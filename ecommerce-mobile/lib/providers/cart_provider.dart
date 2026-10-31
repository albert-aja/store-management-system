import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cart_model.dart';
import '../models/product_model.dart';
import 'catalog_provider.dart';

class CartNotifier extends Notifier<Cart> {
  @override
  Cart build() {
    Future.microtask(() => loadCart());
    return Cart.empty();
  }

  Future<void> loadCart() async {
    final api = ref.read(apiClientProvider);
    final cart = await api.getCart();
    state = cart;
  }

  Future<void> addToCart(
    ProductSummary product, {
    int quantity = 1,
    String? variantId,
  }) async {
    final api = ref.read(apiClientProvider);
    final updated = await api.addToCart(
      product,
      quantity: quantity,
      variantId: variantId,
    );
    state = updated;
  }

  Future<void> updateQuantity(String itemId, int quantity) async {
    final api = ref.read(apiClientProvider);
    final updated = await api.updateQuantity(itemId, quantity);
    state = updated;
  }
}

final cartProvider = NotifierProvider<CartNotifier, Cart>(CartNotifier.new);
