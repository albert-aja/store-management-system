import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_text.dart';
import '../models/product_model.dart';
import '../models/wishlist_share_model.dart';
import '../providers/catalog_provider.dart';
import '../providers/wishlist_share_provider.dart';
import '../widgets/language_switcher.dart';
import '../widgets/wishlist_share_actions.dart';
import 'product_detail_screen.dart';

class SharedWishlistScreen extends ConsumerStatefulWidget {
  final String token;
  const SharedWishlistScreen({super.key, required this.token});

  @override
  ConsumerState<SharedWishlistScreen> createState() =>
      _SharedWishlistScreenState();
}

class _SharedWishlistScreenState extends ConsumerState<SharedWishlistScreen> {
  final Set<String> _busy = {};
  Timer? _expiryTimer;
  DateTime? _scheduledExpiry;

  @override
  void dispose() {
    _expiryTimer?.cancel();
    super.dispose();
  }

  void _scheduleExpiry(DateTime expiresAt) {
    if (_scheduledExpiry == expiresAt) return;
    _scheduledExpiry = expiresAt;
    _expiryTimer?.cancel();
    final remaining = expiresAt.difference(DateTime.now());
    if (remaining > Duration.zero) {
      _expiryTimer = Timer(remaining, () {
        if (mounted) setState(() {});
      });
    }
  }

  Future<void> _refresh() async {
    try {
      final data = await ref.refresh(sharedWishlistProvider(widget.token).future);
      if (!mounted) return;
      for (final item in data.items) {
        ref.invalidate(reservationKeyProvider((widget.token, item.id)));
      }
    } catch (error) {
      if (mounted) showWishlistShareError(context, error);
    }
  }

  Future<void> _act(
    SharedWishlistItem item, {
    bool cancel = false,
    String? recoveryKey,
  }) async {
    final snapshot = ref.read(sharedWishlistProvider(widget.token)).value;
    if (snapshot == null || snapshot.expired) {
      showWishlistShareError(context, StateError('Snapshot unavailable'));
      return;
    }
    setState(() => _busy.add(item.id));
    Object? failure;
    try {
      final service = ref.read(wishlistReservationServiceProvider);
      if (cancel) {
        await service.cancel(widget.token, item.id, recoveryKey: recoveryKey);
      } else {
        await service.reserve(widget.token, item.id);
      }
    } catch (error) {
      failure = error;
    }
    if (!mounted) return;
    ref.invalidate(reservationKeyProvider((widget.token, item.id)));
    // Always re-read authoritative state, including conflicts and lost responses.
    try {
      final refreshed = ref.refresh(sharedWishlistProvider(widget.token).future);
      await refreshed;
    } catch (error) {
      if (mounted) showWishlistShareError(context, error);
    }
    if (!mounted) return;
    setState(() => _busy.remove(item.id));
    if (failure is ReservationKeyStorageFailure) {
      await showPrivateCancellationKey(
        context,
        failure.cancellationKey,
        storageFailed: true,
      );
    } else if (failure != null) {
      showWishlistShareError(context, failure);
    }
  }

  Future<void> _recover(SharedWishlistItem item) async {
    final controller = TextEditingController();
    final key = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppText.useRecoveryKey(context)),
        content: TextField(
          controller: controller,
          obscureText: true,
          autocorrect: false,
          enableSuggestions: false,
          decoration: InputDecoration(labelText: AppText.recoveryKey(context)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(MaterialLocalizations.of(context).cancelButtonLabel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: Text(AppText.cancelGiftIntent(context)),
          ),
        ],
      ),
    );
    // The dialog's exit animation may still reference its controller.
    if (mounted && key != null) {
      if (key.isEmpty) {
        showWishlistShareError(context, const MissingReservationKey());
      } else {
        await _act(item, cancel: true, recoveryKey: key);
      }
    }
    await Future<void>.delayed(const Duration(milliseconds: 300));
    controller.dispose();
  }

  Widget _item(SharedWishlistItem item) {
    final pair = (widget.token, item.id);
    final keyState = ref.watch(reservationKeyProvider(pair));
    final key = keyState.value;
    final busy = _busy.contains(item.id);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (item.primaryImageUrl case final image? when image.isNotEmpty)
              Image.network(
                image,
                height: 100,
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) =>
                    const Icon(Icons.image_not_supported),
              ),
            Text(
              item.productName,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            if (item.variantName case final variant?) Text(variant),
            if (item.reserved) Text(AppText.giftIntentReserved(context)),
            if (keyState.hasError) Text(AppText.keyReadFailed(context)),
            if (ref.read(wishlistReservationServiceProvider).keyNotSaved(widget.token, item.id))
              Text(AppText.keyStorageFailed(context)),
            Wrap(
              spacing: 8,
              children: [
                TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (_) => SharedWishlistProductScreen(
                        productId: item.productId,
                      ),
                    ),
                  ),
                  child: Text(AppText.viewCurrentProduct(context)),
                ),
                if (!item.reserved)
                  FilledButton(
                    onPressed: busy || keyState.isLoading || keyState.hasError
                        ? null
                        : () => _act(item),
                    child: Text(AppText.claimGiftIntent(context)),
                  ),
                if (item.reserved && key != null) ...[
                  OutlinedButton(
                    onPressed: busy ? null : () => _act(item, cancel: true),
                    child: Text(AppText.cancelGiftIntent(context)),
                  ),
                  TextButton(
                    onPressed: () => showPrivateCancellationKey(context, key),
                    child: Text(AppText.recoveryKey(context)),
                  ),
                ],
                if (item.reserved && key == null)
                  OutlinedButton(
                    onPressed: busy ? null : () => _recover(item),
                    child: Text(AppText.useRecoveryKey(context)),
                  ),
              ],
            ),
            if (busy) const LinearProgressIndicator(),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final snapshot = ref.watch(sharedWishlistProvider(widget.token));
    return Scaffold(
      appBar: AppBar(
        title: Text(AppText.sharedWishlist(context)),
        actions: [
          const LanguageSwitcher(),
          IconButton(
            tooltip: AppText.refresh(context),
            onPressed: _refresh,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: snapshot.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(wishlistShareError(context, error)),
                TextButton(
                  onPressed: _refresh,
                  child: Text(AppText.refresh(context)),
                ),
              ],
            ),
          ),
        ),
        data: (data) {
          _scheduleExpiry(data.expiresAt);
          if (data.expired) {
            return Center(child: Text(AppText.snapshotExpired(context)));
          }
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                Text(AppText.giftIntentInfo(context)),
                Text(AppText.snapshotExpires(context, data.expiresAt)),
                for (final item in data.items) _item(item),
              ],
            ),
          );
        },
      ),
    );
  }
}

// Fetch by the shared product ID, then reuse the existing product details UI.
class SharedWishlistProductScreen extends ConsumerStatefulWidget {
  final String productId;
  const SharedWishlistProductScreen({super.key, required this.productId});

  @override
  ConsumerState<SharedWishlistProductScreen> createState() =>
      _SharedWishlistProductScreenState();
}

class _SharedWishlistProductScreenState
    extends ConsumerState<SharedWishlistProductScreen> {
  late Future<ProductSummary> _product;

  @override
  void initState() {
    super.initState();
    _product = ref.read(apiClientProvider).getProductById(widget.productId);
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<ProductSummary>(
    future: _product,
    builder: (context, result) {
      if (result.hasData) {
        return ProductDetailScreen(product: result.requireData);
      }
      return Scaffold(
        appBar: AppBar(title: Text(AppText.productDetails(context))),
        body: Center(
          child: result.hasError
              ? Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(AppText.shareOperationFailed(context)),
                    TextButton(
                      onPressed: () => setState(() {
                        _product = ref
                            .read(apiClientProvider)
                            .getProductById(widget.productId);
                      }),
                      child: Text(AppText.refresh(context)),
                    ),
                  ],
                )
              : const CircularProgressIndicator(),
        ),
      );
    },
  );
}
