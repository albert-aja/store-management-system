import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_client.dart';
import '../core/wishlist_share_links.dart';
import '../models/wishlist_share_model.dart';
import 'catalog_provider.dart';
import 'auth_provider.dart';

final wishlistShareLinksProvider = Provider<WishlistShareLinks>(
  (ref) => const WishlistShareLinks(),
);

final wishlistSharesProvider = FutureProvider<List<WishlistShare>>((ref) {
  ref.watch(authProvider.select((state) => state.value?.customerId));
  return ref.watch(apiClientProvider).getWishlistShares();
});

final sharedWishlistProvider = FutureProvider.family<SharedWishlist, String>(
  (ref, token) => ref.watch(apiClientProvider).getSharedWishlist(token),
);

abstract class ReservationKeyStore {
  Future<String?> read(String token, String itemId);
  Future<void> write(String token, String itemId, String key);
  Future<void> remove(String token, String itemId);
}

class PreferencesReservationKeyStore implements ReservationKeyStore {
  String _name(String token, String itemId) =>
      'wishlist_private_cancel_${base64Url.encode(utf8.encode(jsonEncode([token, itemId])))}';

  @override
  Future<String?> read(String token, String itemId) async =>
      (await SharedPreferences.getInstance()).getString(_name(token, itemId));

  @override
  Future<void> write(String token, String itemId, String key) async {
    final prefs = await SharedPreferences.getInstance();
    if (!await prefs.setString(_name(token, itemId), key)) {
      throw StateError('Unable to persist private cancellation key');
    }
  }

  @override
  Future<void> remove(String token, String itemId) async {
    final prefs = await SharedPreferences.getInstance();
    if (!await prefs.remove(_name(token, itemId))) {
      throw StateError('Unable to remove private cancellation key');
    }
  }
}

class ReservationKeyStorageFailure implements Exception {
  final String cancellationKey;
  const ReservationKeyStorageFailure(this.cancellationKey);
}

class MissingReservationKey implements Exception {
  const MissingReservationKey();
}

class WishlistReservationService {
  final ApiClient api;
  final ReservationKeyStore store;
  final Map<(String, String), String> _memory = {};
  final Set<(String, String)> _unsaved = {};

  WishlistReservationService(this.api, this.store);

  bool keyNotSaved(String token, String itemId) =>
      _unsaved.contains((token, itemId));

  Future<String?> key(String token, String itemId) async =>
      _memory[(token, itemId)] ?? await store.read(token, itemId);

  Future<void> reserve(String token, String itemId) async {
    final cancellationKey = await api.reserveSharedWishlistItem(token, itemId);
    _memory[(token, itemId)] = cancellationKey;
    try {
      await store.write(token, itemId, cancellationKey);
      _unsaved.remove((token, itemId));
    } catch (_) {
      _unsaved.add((token, itemId));
      // Keep recovery available in memory, but never report durable success.
      throw ReservationKeyStorageFailure(cancellationKey);
    }
  }

  Future<void> cancel(
    String token,
    String itemId, {
    String? recoveryKey,
  }) async {
    final cancellationKey = recoveryKey ?? await key(token, itemId);
    if (cancellationKey == null || cancellationKey.isEmpty) {
      throw const MissingReservationKey();
    }
    await api.cancelSharedWishlistReservation(token, itemId, cancellationKey);
    _memory.remove((token, itemId));
    _unsaved.remove((token, itemId));
    await store.remove(token, itemId);
  }
}

final reservationKeyStoreProvider = Provider<ReservationKeyStore>(
  (ref) => PreferencesReservationKeyStore(),
);

final wishlistReservationServiceProvider = Provider<WishlistReservationService>(
  (ref) => WishlistReservationService(
    ref.watch(apiClientProvider),
    ref.watch(reservationKeyStoreProvider),
  ),
);

final reservationKeyProvider = FutureProvider.family<String?, (String, String)>(
  (ref, pair) {
    return ref.watch(wishlistReservationServiceProvider).key(pair.$1, pair.$2);
  },
);
