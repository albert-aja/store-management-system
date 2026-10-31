import 'package:flutter_test/flutter_test.dart';
import 'package:ecommerce_mobile/models/wishlist_model.dart';
import 'package:ecommerce_mobile/core/api_client.dart';
import 'package:ecommerce_mobile/core/image_optimizer.dart';

void main() {
  group('P.16 Wishlist Model & Price Drop Tests', () {
    test('WishlistItem correctly calculates price drop and discount percentage', () {
      final item = WishlistItem(
        id: 'wl-test-1',
        productId: 'prd-1',
        productName: 'Samsung 55" UHD Smart TV',
        sku: 'SAM-55',
        categoryName: 'Smart TV',
        brandName: 'Samsung',
        primaryImageUrl: 'https://example.com/tv.jpg',
        commercialAvailability: 'IN_STOCK',
        leadTimeDays: 1,
        inStockCount: 10,
        originalAddedPrice: 8000000.0,
        currentPrice: 7200000.0,
        hasPriceDrop: true,
        priceDropAmount: 800000.0,
        priceDropPercentage: 10.0,
      );

      expect(item.hasPriceDrop, isTrue);
      expect(item.priceDropAmount, 800000.0);
      expect(item.discountBadge, '-10.0%');
      expect(item.isReadyStock, isTrue);
    });

    test('WishlistItem JSON serialization and deserialization', () {
      final json = {
        'id': 'wl-tv-json',
        'productId': 'prd-1',
        'productName': 'LG Smart TV 4K',
        'sku': 'LG-TV-4K',
        'categoryName': 'Smart TV & Audio',
        'brandName': 'LG',
        'primaryImageUrl': 'https://images.unsplash.com/tv.webp',
        'commercialAvailability': 'AVAILABLE_PROCUREMENT_REQUIRED',
        'leadTimeDays': 4,
        'inStockCount': 0,
        'originalAddedPrice': 6000000.0,
        'currentPrice': 5400000.0,
        'hasPriceDrop': true,
        'priceDropAmount': 600000.0,
        'priceDropPercentage': 10.0,
        'notes': 'Untuk hadiah pernikahan',
      };

      final item = WishlistItem.fromJson(json);

      expect(item.id, 'wl-tv-json');
      expect(item.productName, 'LG Smart TV 4K');
      expect(item.hasPriceDrop, isTrue);
      expect(item.priceDropPercentage, 10.0);
      expect(item.notes, 'Untuk hadiah pernikahan');
      expect(item.isReadyStock, isFalse);

      final encoded = item.toJson();
      expect(encoded['sku'], 'LG-TV-4K');
      expect(encoded['hasPriceDrop'], isTrue);
    });

    test('WishlistSummary aggregates items and total savings accurately', () {
      final json = {
        'items': [
          {
            'id': 'item-1',
            'productId': 'p-1',
            'productName': 'Product 1',
            'sku': 'P-1',
            'categoryName': 'Cat',
            'brandName': 'Brand',
            'primaryImageUrl': '',
            'commercialAvailability': 'IN_STOCK',
            'leadTimeDays': 1,
            'inStockCount': 5,
            'originalAddedPrice': 1000000.0,
            'currentPrice': 800000.0,
            'hasPriceDrop': true,
            'priceDropAmount': 200000.0,
            'priceDropPercentage': 20.0,
          },
          {
            'id': 'item-2',
            'productId': 'p-2',
            'productName': 'Product 2',
            'sku': 'P-2',
            'categoryName': 'Cat',
            'brandName': 'Brand',
            'primaryImageUrl': '',
            'commercialAvailability': 'IN_STOCK',
            'leadTimeDays': 1,
            'inStockCount': 5,
            'originalAddedPrice': 500000.0,
            'currentPrice': 500000.0,
            'hasPriceDrop': false,
            'priceDropAmount': 0.0,
            'priceDropPercentage': 0.0,
          }
        ],
        'totalItems': 2,
        'priceDropCount': 1,
        'totalPotentialSavings': 200000.0,
      };

      final summary = WishlistSummary.fromJson(json);

      expect(summary.totalItems, 2);
      expect(summary.priceDropCount, 1);
      expect(summary.totalPotentialSavings, 200000.0);
    });

    test('ApiClient mock wishlist operations', () async {
      final api = ApiClient();
      final initial = await api.getWishlist();

      expect(initial.items.isNotEmpty, isTrue);
      expect(initial.priceDropCount, greaterThanOrEqualTo(1));

      // Test simulation price drop
      final firstItem = initial.items.first;
      final dropped = await api.simulatePriceDrop(firstItem.id, newPrice: 5000000.0);

      expect(dropped.currentPrice, 5000000.0);
      expect(dropped.hasPriceDrop, isTrue);
    });

    test('P.22 ImageOptimizer registers and verifies critical above-the-fold preload URLs', () {
      const heroUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80';
      expect(ImageOptimizer.isPreloaded(heroUrl, preset: ImagePreset.hero), isFalse);

      ImageOptimizer.registerPreloadedUrl(heroUrl, preset: ImagePreset.hero);
      expect(ImageOptimizer.isPreloaded(heroUrl, preset: ImagePreset.hero), isTrue);
    });
  });
}
