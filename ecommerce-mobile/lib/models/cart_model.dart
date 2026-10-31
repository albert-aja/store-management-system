class CartItem {
  final String itemId;
  final String variantId;
  final String productName;
  final String variantName;
  final String sku;
  final double unitPrice;
  final double? originalUnitPrice;
  final double? discountAmount;
  final bool hasDiscount;
  final String? discountLabel;
  int quantity;
  double subtotal;
  final String imageUrl;
  final String commercialAvailability;

  CartItem({
    required this.itemId,
    required this.variantId,
    required this.productName,
    required this.variantName,
    required this.sku,
    required this.unitPrice,
    this.originalUnitPrice,
    this.discountAmount,
    this.hasDiscount = false,
    this.discountLabel,
    required this.quantity,
    required this.subtotal,
    required this.imageUrl,
    required this.commercialAvailability,
  });

  bool get isReadyStock => commercialAvailability == 'IN_STOCK';

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      itemId: json['itemId'] ?? '',
      variantId: json['variantId'] ?? '',
      productName: json['productName'] ?? '',
      variantName: json['variantName'] ?? '',
      sku: json['sku'] ?? '',
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      originalUnitPrice: (json['originalUnitPrice'] as num?)?.toDouble(),
      discountAmount: (json['discountAmount'] as num?)?.toDouble(),
      hasDiscount: json['hasDiscount'] ?? false,
      discountLabel: json['discountLabel'],
      quantity: json['quantity'] ?? 1,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      imageUrl:
          json['imageUrl'] ??
          'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
      commercialAvailability: json['commercialAvailability'] ?? 'IN_STOCK',
    );
  }
}

class Cart {
  final String cartId;
  final List<CartItem> items;
  final int totalItemCount;
  final double subtotalAmount;
  final double? totalDiscountAmount;
  final double orderDiscountAmount;
  final String? orderDiscountLabel;
  final double estimatedTax;
  final double totalAmount;

  Cart({
    required this.cartId,
    required this.items,
    required this.totalItemCount,
    required this.subtotalAmount,
    this.totalDiscountAmount,
    this.orderDiscountAmount = 0,
    this.orderDiscountLabel,
    required this.estimatedTax,
    required this.totalAmount,
  });

  factory Cart.empty() {
    return Cart(
      cartId: '',
      items: [],
      totalItemCount: 0,
      subtotalAmount: 0.0,
      totalDiscountAmount: 0.0,
      orderDiscountAmount: 0.0,
      estimatedTax: 0.0,
      totalAmount: 0.0,
    );
  }

  factory Cart.fromJson(Map<String, dynamic> json) {
    final list =
        (json['items'] as List<dynamic>?)
            ?.map((e) => CartItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    return Cart(
      cartId: json['cartId'] ?? '',
      items: list,
      totalItemCount: json['totalItemCount'] ?? 0,
      subtotalAmount: (json['subtotalAmount'] as num?)?.toDouble() ?? 0.0,
      totalDiscountAmount: (json['totalDiscountAmount'] as num?)?.toDouble(),
      orderDiscountAmount:
          (json['orderDiscountAmount'] as num?)?.toDouble() ?? 0.0,
      orderDiscountLabel: json['orderDiscountLabel'],
      estimatedTax: (json['estimatedTax'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
