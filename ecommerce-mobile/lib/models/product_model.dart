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

  bool get isFurniture =>
      categoryName.toLowerCase().contains('furniture') ||
      categoryName.toLowerCase().contains('mebel') ||
      RegExp(r'sofa|lemari|wardrobe|makan|dining|kursi|bed|kasur|meja', caseSensitive: false)
          .hasMatch(name);

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


class ArModelInfo {
  final bool isSupported;
  final String furnitureType;
  final String modelGlbUrl;
  final String modelUsdzUrl;
  final int widthCm;
  final int depthCm;
  final int heightCm;
  final String defaultColor;
  final List<ArColorVariantInfo> colorVariants;
  final List<ArHotspotInfo> hotspots;
  final String roomPlacement;
  final String recommendedRoom;

  ArModelInfo({
    this.isSupported = true,
    required this.furnitureType,
    required this.modelGlbUrl,
    required this.modelUsdzUrl,
    required this.widthCm,
    required this.depthCm,
    required this.heightCm,
    required this.defaultColor,
    required this.colorVariants,
    required this.hotspots,
    this.roomPlacement = 'FLOOR',
    this.recommendedRoom = 'LIVING_ROOM',
  });

  factory ArModelInfo.fromJson(Map<String, dynamic> json) {
    return ArModelInfo(
      isSupported: json['isSupported'] ?? true,
      furnitureType: json['furnitureType'] ?? 'FURNITURE_GENERAL',
      modelGlbUrl: json['modelGlbUrl'] ?? '',
      modelUsdzUrl: json['modelUsdzUrl'] ?? '',
      widthCm: json['widthCm'] ?? 150,
      depthCm: json['depthCm'] ?? 80,
      heightCm: json['heightCm'] ?? 80,
      defaultColor: json['defaultColor'] ?? 'Charcoal Grey',
      colorVariants: (json['colorVariants'] as List<dynamic>?)
              ?.map((c) => ArColorVariantInfo.fromJson(c))
              .toList() ??
          [],
      hotspots: (json['hotspots'] as List<dynamic>?)
              ?.map((h) => ArHotspotInfo.fromJson(h))
              .toList() ??
          [],
      roomPlacement: json['roomPlacement'] ?? 'FLOOR',
      recommendedRoom: json['recommendedRoom'] ?? 'LIVING_ROOM',
    );
  }

  factory ArModelInfo.forProduct(ProductSummary p) {
    final name = p.name.toLowerCase();
    final isSofa = name.contains('sofa');
    final isWardrobe = name.contains('lemari') || name.contains('wardrobe');
    final isDining = name.contains('makan') || name.contains('dining');

    if (isSofa) {
      return ArModelInfo(
        furnitureType: 'SOFA',
        modelGlbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
        modelUsdzUrl: 'https://developer.apple.com/augmented-reality/quick-look/models/chair/chair.usdz',
        widthCm: 210,
        depthCm: 90,
        heightCm: 85,
        defaultColor: 'Charcoal Grey',
        colorVariants: [
          ArColorVariantInfo(name: 'Charcoal Grey', hexCode: '#374151', materialFinish: 'Woven Fabric'),
          ArColorVariantInfo(name: 'Cream White', hexCode: '#F3F4F6', materialFinish: 'Boucle Fabric'),
          ArColorVariantInfo(name: 'Navy Blue', hexCode: '#1E3A8A', materialFinish: 'Velvet Fabric'),
          ArColorVariantInfo(name: 'Cognac Brown', hexCode: '#92400E', materialFinish: 'Leather'),
        ],
        hotspots: [
          ArHotspotInfo(title: 'Busa High-Density 30', description: 'Tahan kempes hingga 5 tahun'),
          ArHotspotInfo(title: 'Rangka Kayu Solid Mahoni', description: 'Kuat menahan beban 300 kg'),
        ],
        recommendedRoom: 'LIVING_ROOM',
      );
    } else if (isWardrobe) {
      return ArModelInfo(
        furnitureType: 'WARDROBE',
        modelGlbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
        modelUsdzUrl: 'https://developer.apple.com/augmented-reality/quick-look/models/chair/chair.usdz',
        widthCm: 120,
        depthCm: 60,
        heightCm: 200,
        defaultColor: 'Warm Oak',
        colorVariants: [
          ArColorVariantInfo(name: 'Warm Oak', hexCode: '#B45309', materialFinish: 'Wood Grain'),
          ArColorVariantInfo(name: 'Pure White Gloss', hexCode: '#F9FAFB', materialFinish: 'High Gloss'),
          ArColorVariantInfo(name: 'Modern Grey', hexCode: '#4B5563', materialFinish: 'Matte'),
        ],
        hotspots: [
          ArHotspotInfo(title: 'Engsel Soft-Close Hidrolik', description: 'Pintu menutup perlahan tanpa suara'),
          ArHotspotInfo(title: 'Gantungan Stainless', description: 'Kapasitas s/d 40 set pakaian'),
        ],
        recommendedRoom: 'BEDROOM',
      );
    } else if (isDining) {
      return ArModelInfo(
        furnitureType: 'DINING_SET',
        modelGlbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
        modelUsdzUrl: 'https://developer.apple.com/augmented-reality/quick-look/models/chair/chair.usdz',
        widthCm: 160,
        depthCm: 90,
        heightCm: 75,
        defaultColor: 'Walnut Solid',
        colorVariants: [
          ArColorVariantInfo(name: 'Walnut Solid', hexCode: '#78350F', materialFinish: 'Natural Wood'),
          ArColorVariantInfo(name: 'Carrara Marble', hexCode: '#E5E7EB', materialFinish: 'Sintered Stone'),
          ArColorVariantInfo(name: 'Black Ash', hexCode: '#1F2937', materialFinish: 'Powder Coat'),
        ],
        hotspots: [
          ArHotspotInfo(title: 'Top Table Sintered Stone', description: 'Tahan gores dan panas s/d 200°C'),
          ArHotspotInfo(title: 'Kaki Baja Kokoh', description: 'Baja profil tebal anti-goyang'),
        ],
        recommendedRoom: 'DINING_ROOM',
      );
    } else {
      return ArModelInfo(
        furnitureType: 'FURNITURE_GENERAL',
        modelGlbUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
        modelUsdzUrl: 'https://developer.apple.com/augmented-reality/quick-look/models/chair/chair.usdz',
        widthCm: 150,
        depthCm: 80,
        heightCm: 80,
        defaultColor: 'Natural Wood',
        colorVariants: [
          ArColorVariantInfo(name: 'Natural Wood', hexCode: '#D97706', materialFinish: 'Veneer'),
          ArColorVariantInfo(name: 'Minimalist White', hexCode: '#FFFFFF', materialFinish: 'Melamine'),
        ],
        hotspots: [
          ArHotspotInfo(title: 'Sistem Knock-Down Presisi', description: 'Pemasangan mudah dan rapi'),
        ],
        recommendedRoom: 'LIVING_ROOM',
      );
    }
  }
}

class ArColorVariantInfo {
  final String name;
  final String hexCode;
  final String materialFinish;

  ArColorVariantInfo({
    required this.name,
    required this.hexCode,
    required this.materialFinish,
  });

  factory ArColorVariantInfo.fromJson(Map<String, dynamic> json) {
    return ArColorVariantInfo(
      name: json['name'] ?? '',
      hexCode: json['hexCode'] ?? '#374151',
      materialFinish: json['materialFinish'] ?? '',
    );
  }
}

class ArHotspotInfo {
  final String title;
  final String description;

  ArHotspotInfo({
    required this.title,
    required this.description,
  });

  factory ArHotspotInfo.fromJson(Map<String, dynamic> json) {
    return ArHotspotInfo(
      title: json['title'] ?? '',
      description: json['description'] ?? '',
    );
  }
}
