import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ecommerce_mobile/main.dart';
import 'package:ecommerce_mobile/models/notification_model.dart';
import 'package:ecommerce_mobile/models/product_model.dart';
import 'package:ecommerce_mobile/models/wishlist_model.dart';
import 'package:ecommerce_mobile/providers/catalog_provider.dart';
import 'package:ecommerce_mobile/providers/notification_provider.dart';
import 'package:ecommerce_mobile/providers/wishlist_provider.dart';

class MockNotificationNotifier extends NotificationNotifier {
  @override
  List<NotificationItem> build() => [];
}

class MockWishlistNotifier extends WishlistNotifier {
  @override
  WishlistSummary build() => WishlistSummary.empty();
}

void main() {
  testWidgets('SMS Storefront App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          featuredProductsProvider.overrideWith(
            (ref) => ref.watch(productsProvider.future),
          ),
          productsProvider.overrideWith(
            (ref) => Future.value([
              ProductSummary(
                id: 'test-1',
                name: 'Test Product',
                code: 'TP-1',
                description: 'Test Desc',
                brandName: 'Test Brand',
                categoryName: 'General',
                minPrice: 100000,
                maxPrice: 100000,
                primaryImageUrl: 'https://example.com/test.jpg',
                commercialAvailability: 'IN_STOCK',
                leadTimeDays: 1,
                inStockCount: 5,
              ),
            ]),
          ),
          notificationsProvider.overrideWith(MockNotificationNotifier.new),
          wishlistProvider.overrideWith(MockWishlistNotifier.new),
        ],
        child: const SmsStorefrontApp(),
      ),
    );

    await tester.pump();

    // Verify SMS Mart title appears
    expect(find.text('SMS Mart'), findsWidgets);
    expect(find.text('Beranda'), findsOneWidget);
    expect(find.text('Katalog'), findsOneWidget);
    expect(find.text('Keranjang'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
