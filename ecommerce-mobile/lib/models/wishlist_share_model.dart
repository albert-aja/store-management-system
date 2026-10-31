class WishlistShare {
  final String id;
  final String? token;
  final DateTime createdAt;
  final DateTime expiresAt;
  final DateTime? revokedAt;

  const WishlistShare({
    required this.id,
    this.token,
    required this.createdAt,
    required this.expiresAt,
    this.revokedAt,
  });

  factory WishlistShare.fromJson(Map<String, dynamic> json) => WishlistShare(
    id: json['id'] as String,
    token: json['token'] as String?,
    createdAt: DateTime.parse(json['createdAt'] as String),
    expiresAt: DateTime.parse(json['expiresAt'] as String),
    revokedAt: json['revokedAt'] == null
        ? null
        : DateTime.parse(json['revokedAt'] as String),
  );

  bool get active => revokedAt == null && DateTime.now().isBefore(expiresAt);
}

// Deliberately independent of WishlistItem: no identity, notes, or prices.
class SharedWishlistItem {
  final String id;
  final String productId;
  final String? variantId;
  final String productName;
  final String? variantName;
  final String? primaryImageUrl;
  final bool reserved;

  const SharedWishlistItem({
    required this.id,
    required this.productId,
    this.variantId,
    required this.productName,
    this.variantName,
    this.primaryImageUrl,
    required this.reserved,
  });

  factory SharedWishlistItem.fromJson(Map<String, dynamic> json) {
    if (json['quantity'] != 1) {
      throw const FormatException('A shared item must have quantity 1');
    }
    return SharedWishlistItem(
      id: json['id'] as String,
      productId: json['productId'] as String,
      variantId: json['variantId'] as String?,
      productName: json['productName'] as String,
      variantName: json['variantName'] as String?,
      primaryImageUrl: json['primaryImageUrl'] as String?,
      reserved: json['reserved'] as bool,
    );
  }
}

class SharedWishlist {
  final DateTime createdAt;
  final DateTime expiresAt;
  final List<SharedWishlistItem> items;

  const SharedWishlist({
    required this.createdAt,
    required this.expiresAt,
    required this.items,
  });

  factory SharedWishlist.fromJson(Map<String, dynamic> json) => SharedWishlist(
    createdAt: DateTime.parse(json['createdAt'] as String),
    expiresAt: DateTime.parse(json['expiresAt'] as String),
    items: List.unmodifiable(
      (json['items'] as List).map(
        (item) =>
            SharedWishlistItem.fromJson(Map<String, dynamic>.from(item as Map)),
      ),
    ),
  );

  bool get expired => !DateTime.now().isBefore(expiresAt);
}
