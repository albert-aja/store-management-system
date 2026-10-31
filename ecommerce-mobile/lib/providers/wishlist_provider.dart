import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../models/wishlist_model.dart';
import '../models/product_model.dart';
import 'catalog_provider.dart';
import 'cart_provider.dart';

class WishlistNotifier extends Notifier<WishlistSummary> {
  int _request = 0;
  @override
  WishlistSummary build() {
    Future.microtask(() => loadWishlist());
    return WishlistSummary.empty();
  }

  Future<void> loadWishlist() async {
    final current = ++_request;
    final api = ref.read(apiClientProvider);
    ref.read(wishlistErrorProvider.notifier).setError(null);
    try {
      final data = await api.getWishlist();
      if (ref.mounted && current == _request) state = data;
    } catch (error) {
      debugPrint('Failed to load wishlist: $error');
      if (ref.mounted && current == _request) {
        ref
            .read(wishlistErrorProvider.notifier)
            .setError('Wishlist gagal dimuat. Silakan coba lagi.');
      }
    }
  }

  void clear() {
    _request++;
    state = WishlistSummary.empty();
  }

  bool isProductWishlisted(String productId) {
    return state.items.any((item) => item.productId == productId);
  }

  Future<bool> toggleWishlist(ProductSummary product, {String? notes}) async {
    final api = ref.read(apiClientProvider);
    final exists = isProductWishlisted(product.id);

    if (exists) {
      await api.removeFromWishlistByProduct(product.id);
      await loadWishlist();
      return false;
    } else {
      await api.addToWishlist(product, notes: notes);
      await loadWishlist();
      return true;
    }
  }

  Future<void> removeItem(String itemId) async {
    final api = ref.read(apiClientProvider);
    await api.removeFromWishlist(itemId);
    await loadWishlist();
  }

  Future<void> moveToCart(String itemId) async {
    final api = ref.read(apiClientProvider);
    await api.moveToCartFromWishlist(itemId);
    await loadWishlist();
    await ref.read(cartProvider.notifier).loadCart();
  }

  Future<void> simulatePriceDrop(String itemId, {double? newPrice}) async {
    final api = ref.read(apiClientProvider);
    await api.simulatePriceDrop(itemId, newPrice: newPrice);
    await loadWishlist();
  }
}

final wishlistProvider = NotifierProvider<WishlistNotifier, WishlistSummary>(
  WishlistNotifier.new,
);

class WishlistErrorNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void setError(String? error) => state = error;
}

final wishlistErrorProvider = NotifierProvider<WishlistErrorNotifier, String?>(
  WishlistErrorNotifier.new,
);

final wishlistCountProvider = Provider<int>((ref) {
  return ref.watch(wishlistProvider).totalItems;
});

final priceDropCountProvider = Provider<int>((ref) {
  return ref.watch(wishlistProvider).priceDropCount;
});
