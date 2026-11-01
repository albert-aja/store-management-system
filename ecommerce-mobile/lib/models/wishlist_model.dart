import '../core/currency_formatter.dart';

class WishlistItem {
  final String id;
  final String productId;
  final String? variantId;
  final String productName;
  final String? variantName;
  final String sku;
  final String categoryName;
  final String brandName;
  final String primaryImageUrl;
  final String commercialAvailability;
  final int leadTimeDays;
  final int inStockCount;
  final double originalAddedPrice;
  final double currentPrice;
  final bool hasPriceDrop;
  final double priceDropAmount;
  final double priceDropPercentage;
  final String? notes;
  final bool notifyOnPriceDrop;
  final double alertDropThresholdPercent;
  final double? lastAlertedPrice;
  final DateTime? lastAlertedAt;
  final DateTime? addedAt;

  WishlistItem({
    required this.id,
    required this.productId,
    this.variantId,
    required this.productName,
    this.variantName,
    required this.sku,
    required this.categoryName,
    required this.brandName,
    required this.primaryImageUrl,
    required this.commercialAvailability,
    required this.leadTimeDays,
    required this.inStockCount,
    required this.originalAddedPrice,
    required this.currentPrice,
    required this.hasPriceDrop,
    required this.priceDropAmount,
    required this.priceDropPercentage,
    this.notes,
    this.notifyOnPriceDrop = true,
    this.alertDropThresholdPercent = 5.0,
    this.lastAlertedPrice,
    this.lastAlertedAt,
    this.addedAt,
  });

  bool get isReadyStock => commercialAvailability == 'IN_STOCK';

  String get formattedOriginalPrice =>
      CurrencyFormatter.format(originalAddedPrice);
  String get formattedCurrentPrice => CurrencyFormatter.format(currentPrice);
  String get formattedPriceDropAmount =>
      CurrencyFormatter.format(priceDropAmount);
  String get discountBadge => '-${priceDropPercentage.toStringAsFixed(1)}%';

  factory WishlistItem.fromJson(Map<String, dynamic> json) {
    return WishlistItem(
      id: json['id']?.toString() ?? '',
      productId: json['productId']?.toString() ?? '',
      variantId: json['variantId']?.toString(),
      productName: json['productName'] ?? '',
      variantName: json['variantName'],
      sku: json['sku'] ?? '',
      categoryName: json['categoryName'] ?? '',
      brandName: json['brandName'] ?? '',
      primaryImageUrl: json['primaryImageUrl'] ?? '',
      commercialAvailability: json['commercialAvailability'] ?? 'IN_STOCK',
      leadTimeDays: (json['leadTimeDays'] as num?)?.toInt() ?? 1,
      inStockCount: (json['inStockCount'] as num?)?.toInt() ?? 0,
      originalAddedPrice:
          (json['originalAddedPrice'] as num?)?.toDouble() ?? 0.0,
      currentPrice: (json['currentPrice'] as num?)?.toDouble() ?? 0.0,
      hasPriceDrop: json['hasPriceDrop'] ?? false,
      priceDropAmount: (json['priceDropAmount'] as num?)?.toDouble() ?? 0.0,
      priceDropPercentage:
          (json['priceDropPercentage'] as num?)?.toDouble() ?? 0.0,
      notes: json['notes'],
      notifyOnPriceDrop: json['notifyOnPriceDrop'] ?? true,
      alertDropThresholdPercent:
          (json['alertDropThresholdPercent'] as num?)?.toDouble() ?? 5.0,
      lastAlertedPrice: (json['lastAlertedPrice'] as num?)?.toDouble(),
      lastAlertedAt: json['lastAlertedAt'] != null
          ? DateTime.tryParse(json['lastAlertedAt'].toString())
          : null,
      addedAt: json['addedAt'] != null
          ? DateTime.tryParse(json['addedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'variantId': variantId,
      'productName': productName,
      'variantName': variantName,
      'sku': sku,
      'categoryName': categoryName,
      'brandName': brandName,
      'primaryImageUrl': primaryImageUrl,
      'commercialAvailability': commercialAvailability,
      'leadTimeDays': leadTimeDays,
      'inStockCount': inStockCount,
      'originalAddedPrice': originalAddedPrice,
      'currentPrice': currentPrice,
      'hasPriceDrop': hasPriceDrop,
      'priceDropAmount': priceDropAmount,
      'priceDropPercentage': priceDropPercentage,
      'notes': notes,
      'notifyOnPriceDrop': notifyOnPriceDrop,
      'alertDropThresholdPercent': alertDropThresholdPercent,
      'lastAlertedPrice': lastAlertedPrice,
      'lastAlertedAt': lastAlertedAt?.toIso8601String(),
      'addedAt': addedAt?.toIso8601String(),
    };
  }

  WishlistItem copyWith({
    double? currentPrice,
    bool? hasPriceDrop,
    double? priceDropAmount,
    double? priceDropPercentage,
    String? notes,
    bool? notifyOnPriceDrop,
    double? alertDropThresholdPercent,
    double? lastAlertedPrice,
    DateTime? lastAlertedAt,
  }) {
    return WishlistItem(
      id: id,
      productId: productId,
      variantId: variantId,
      productName: productName,
      variantName: variantName,
      sku: sku,
      categoryName: categoryName,
      brandName: brandName,
      primaryImageUrl: primaryImageUrl,
      commercialAvailability: commercialAvailability,
      leadTimeDays: leadTimeDays,
      inStockCount: inStockCount,
      originalAddedPrice: originalAddedPrice,
      currentPrice: currentPrice ?? this.currentPrice,
      hasPriceDrop: hasPriceDrop ?? this.hasPriceDrop,
      priceDropAmount: priceDropAmount ?? this.priceDropAmount,
      priceDropPercentage: priceDropPercentage ?? this.priceDropPercentage,
      notes: notes ?? this.notes,
      notifyOnPriceDrop: notifyOnPriceDrop ?? this.notifyOnPriceDrop,
      alertDropThresholdPercent:
          alertDropThresholdPercent ?? this.alertDropThresholdPercent,
      lastAlertedPrice: lastAlertedPrice ?? this.lastAlertedPrice,
      lastAlertedAt: lastAlertedAt ?? this.lastAlertedAt,
      addedAt: addedAt,
    );
  }
}

class WishlistSummary {
  final List<WishlistItem> items;
  final int totalItems;
  final int priceDropCount;
  final double totalPotentialSavings;

  WishlistSummary({
    required this.items,
    required this.totalItems,
    required this.priceDropCount,
    required this.totalPotentialSavings,
  });

  String get formattedTotalSavings =>
      CurrencyFormatter.format(totalPotentialSavings);

  factory WishlistSummary.empty() {
    return WishlistSummary(
      items: const [],
      totalItems: 0,
      priceDropCount: 0,
      totalPotentialSavings: 0.0,
    );
  }

  factory WishlistSummary.fromJson(Map<String, dynamic> json) {
    final list =
        (json['items'] as List<dynamic>?)
            ?.map((e) => WishlistItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    return WishlistSummary(
      items: list,
      totalItems: (json['totalItems'] as num?)?.toInt() ?? list.length,
      priceDropCount:
          (json['priceDropCount'] as num?)?.toInt() ??
          list.where((i) => i.hasPriceDrop).length,
      totalPotentialSavings:
          (json['totalPotentialSavings'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
