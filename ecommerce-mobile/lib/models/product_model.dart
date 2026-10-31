class ProductSummary {
  final String id;
  final String name;
  final String code;
  final String description;
  final String brandName;
  final String categoryName;
  final double minPrice;
  final double maxPrice;
  final double? originalMinPrice;
  final bool hasDiscount;
  final int maxDiscountPercent;
  final String? discountLabel;
  final bool flashSale;
  final DateTime? flashSaleEndsAt;
  final String? primaryVariantId;
  final String primaryImageUrl;
  final String
  commercialAvailability; // IN_STOCK, AVAILABLE_PROCUREMENT_REQUIRED, PREORDER
  final int leadTimeDays;
  final int inStockCount;

  ProductSummary({
    required this.id,
    required this.name,
    required this.code,
    required this.description,
    required this.brandName,
    required this.categoryName,
    required this.minPrice,
    required this.maxPrice,
    this.originalMinPrice,
    this.hasDiscount = false,
    this.maxDiscountPercent = 0,
    this.discountLabel,
    this.flashSale = false,
    this.flashSaleEndsAt,
    this.primaryVariantId,
    required this.primaryImageUrl,
    required this.commercialAvailability,
    required this.leadTimeDays,
    required this.inStockCount,
  });

  bool get isReadyStock => commercialAvailability == 'IN_STOCK';

  factory ProductSummary.fromJson(Map<String, dynamic> json) {
    return ProductSummary(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      description: json['description'] ?? '',
      brandName: json['brandName'] ?? 'SMS Mart',
      categoryName: json['categoryName'] ?? 'General',
      minPrice: (json['minPrice'] as num?)?.toDouble() ?? 0.0,
      maxPrice: (json['maxPrice'] as num?)?.toDouble() ?? 0.0,
      originalMinPrice: (json['originalMinPrice'] as num?)?.toDouble(),
      hasDiscount: json['hasDiscount'] ?? false,
      maxDiscountPercent: json['maxDiscountPercent'] ?? 0,
      discountLabel: json['discountLabel'],
      flashSale: json['flashSale'] ?? false,
      flashSaleEndsAt: DateTime.tryParse(json['flashSaleEndsAt'] ?? ''),
      primaryVariantId: json['primaryVariantId'],
      primaryImageUrl:
          json['primaryImageUrl'] ??
          'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
      commercialAvailability: json['commercialAvailability'] ?? 'IN_STOCK',
      leadTimeDays: json['leadTimeDays'] ?? 1,
      inStockCount: json['inStockCount'] ?? 0,
    );
  }
}

class ProductVariant {
  final String id;
  final String name;
  final String sku;
  final double price;
  final double? originalPrice;
  final double? discountAmount;
  final int discountPercent;
  final bool hasDiscount;
  final String? discountLabel;
  final bool flashSale;
  final DateTime? flashSaleEndsAt;
  final int stockCount;
  final String commercialAvailability;
  final int leadTimeDays;

  ProductVariant({
    required this.id,
    required this.name,
    required this.sku,
    required this.price,
    this.originalPrice,
    this.discountAmount,
    this.discountPercent = 0,
    this.hasDiscount = false,
    this.discountLabel,
    this.flashSale = false,
    this.flashSaleEndsAt,
    required this.stockCount,
    required this.commercialAvailability,
    required this.leadTimeDays,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      sku: json['sku'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      discountAmount: (json['discountAmount'] as num?)?.toDouble(),
      discountPercent: json['discountPercent'] ?? 0,
      hasDiscount: json['hasDiscount'] ?? false,
      discountLabel: json['discountLabel'],
      flashSale: json['flashSale'] ?? false,
      flashSaleEndsAt: DateTime.tryParse(json['flashSaleEndsAt'] ?? ''),
      stockCount: json['stockCount'] ?? 0,
      commercialAvailability: json['commercialAvailability'] ?? 'IN_STOCK',
      leadTimeDays: json['leadTimeDays'] ?? 1,
    );
  }
}
