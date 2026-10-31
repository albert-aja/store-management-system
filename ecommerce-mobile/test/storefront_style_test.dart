import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ecommerce_mobile/core/app_theme.dart';
import 'package:ecommerce_mobile/models/cart_model.dart';
import 'package:ecommerce_mobile/models/notification_model.dart';
import 'package:ecommerce_mobile/models/product_model.dart';
import 'package:ecommerce_mobile/models/wishlist_model.dart';
import 'package:ecommerce_mobile/providers/cart_provider.dart';
import 'package:ecommerce_mobile/providers/catalog_provider.dart';
import 'package:ecommerce_mobile/providers/notification_provider.dart';
import 'package:ecommerce_mobile/providers/wishlist_provider.dart';
import 'package:ecommerce_mobile/widgets/product_card.dart';
import 'package:ecommerce_mobile/screens/catalog_screen.dart';
import 'package:ecommerce_mobile/screens/home_screen.dart';

class TestNotificationNotifier extends NotificationNotifier {
  @override
  List<NotificationItem> build() => [];
}

class TestCartNotifier extends CartNotifier {
  String? variant;
  @override
  Cart build() => Cart.empty();
  @override
  Future<void> addToCart(
    ProductSummary product, {
    int quantity = 1,
    String? variantId,
  }) async {
    variant = variantId;
  }
}

class TestWishlistNotifier extends WishlistNotifier {
  bool toggled = false;
  @override
  WishlistSummary build() => WishlistSummary.empty();
  @override
  Future<bool> toggleWishlist(ProductSummary product, {String? notes}) async {
    toggled = true;
    return true;
  }
}

ProductSummary product({bool sale = false}) => ProductSummary(
  id: 'product-1',
  primaryVariantId: 'variant-1',
  name: 'Furniture pilihan dengan nama panjang untuk rumah dan ruang keluarga',
  code: 'PRODUCT-1',
  description: '',
  brandName: 'SMS',
  categoryName: 'Furniture',
  minPrice: 15000000,
  maxPrice: 15000000,
  hasDiscount: sale,
  originalMinPrice: sale ? 16000000 : null,
  maxDiscountPercent: 6,
  flashSale: sale,
  flashSaleEndsAt: sale ? DateTime.now().add(const Duration(hours: 1)) : null,
  primaryImageUrl: 'https://example.com/product.jpg',
  commercialAvailability: 'IN_STOCK',
  leadTimeDays: 1,
  inStockCount: 5,
);

void main() {
  for (final size in [
    (320.0, 2),
    (390.0, 2),
    (768.0, 3),
    (1024.0, 4),
    (1200.0, 4),
  ]) {
    testWidgets(
      'Product grid at ${size.$1}px has ${size.$2} columns and no overflow',
      (tester) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = Size(size.$1, 1100);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              cartProvider.overrideWith(TestCartNotifier.new),
              wishlistProvider.overrideWith(TestWishlistNotifier.new),
            ],
            child: MaterialApp(
              locale: const Locale('id'),
              supportedLocales: const [Locale('id'), Locale('en')],
              localizationsDelegates: GlobalMaterialLocalizations.delegates,
              theme: AppTheme.lightTheme,
              home: Scaffold(
                body: Padding(
                  padding: const EdgeInsets.all(16),
                  child: ProductGrid(
                    products: List.generate(4, (_) => product(sale: true)),
                    scrollable: true,
                  ),
                ),
              ),
            ),
          ),
        );
        await tester.pump(const Duration(milliseconds: 200));
        final grid = tester.widget<GridView>(find.byType(GridView));
        expect(
          (grid.gridDelegate as SliverGridDelegateWithFixedCrossAxisCount)
              .crossAxisCount,
          size.$2,
        );
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
      },
    );
  }

  for (final sample in [(320.0, true), (390.0, true), (390.0, false)]) {
    testWidgets(
      'Cards preserve actions with large text at ${sample.$1}px, sale=${sample.$2}',
      (tester) async {
        final cart = TestCartNotifier();
        final wishlist = TestWishlistNotifier();
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = Size(sample.$1, 1100);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              cartProvider.overrideWith(() => cart),
              wishlistProvider.overrideWith(() => wishlist),
            ],
            child: MaterialApp(
              locale: const Locale('id'),
              supportedLocales: const [Locale('id'), Locale('en')],
              localizationsDelegates: GlobalMaterialLocalizations.delegates,
              theme: AppTheme.lightTheme,
              builder: (context, child) => MediaQuery(
                data: MediaQuery.of(
                  context,
                ).copyWith(textScaler: const TextScaler.linear(1.5)),
                child: child!,
              ),
              home: Scaffold(
                body: Padding(
                  padding: const EdgeInsets.all(16),
                  child: ProductGrid(
                    products: [
                      product(sale: sample.$2),
                      product(sale: sample.$2),
                    ],
                    scrollable: true,
                  ),
                ),
              ),
            ),
          ),
        );
        await tester.pump(const Duration(milliseconds: 200));
        expect(tester.takeException(), isNull);
        await tester.tap(find.text('Tambah').first);
        await tester.pump();
        expect(cart.variant, 'variant-1');
        await tester.tap(find.byTooltip('Simpan ke Wishlist').first);
        await tester.pump();
        expect(wishlist.toggled, isTrue);
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
      },
    );
  }

  for (final width in [320.0, 390.0, 768.0]) {
    for (final catalog in [false, true]) {
      testWidgets('${catalog ? 'Catalog' : 'Home'} fits ${width}px', (
        tester,
      ) async {
        tester.view.devicePixelRatio = 1;
        tester.view.physicalSize = Size(width, 1100);
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        var openedCatalog = false;
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              productsProvider.overrideWith(
                (ref) async => [product(sale: true)],
              ),
              featuredProductsProvider.overrideWith(
                (ref) async => [product(sale: true)],
              ),
              notificationsProvider.overrideWith(TestNotificationNotifier.new),
              cartProvider.overrideWith(TestCartNotifier.new),
              wishlistProvider.overrideWith(TestWishlistNotifier.new),
            ],
            child: MaterialApp(
              locale: const Locale('id'),
              supportedLocales: const [Locale('id'), Locale('en')],
              localizationsDelegates: GlobalMaterialLocalizations.delegates,
              theme: AppTheme.lightTheme,
              home: catalog
                  ? const CatalogScreen()
                  : HomeScreen(onOpenCatalog: () => openedCatalog = true),
            ),
          ),
        );
        await tester.pump(const Duration(milliseconds: 200));
        expect(tester.takeException(), isNull);
        if (catalog) {
          await tester.ensureVisible(find.text('Indent'));
          await tester.pump();
          await tester.tap(find.text('Indent'));
          await tester.pump();
          final container = ProviderScope.containerOf(
            tester.element(find.byType(CatalogScreen)),
          );
          expect(
            container.read(availabilityFilterProvider),
            'AVAILABLE_PROCUREMENT_REQUIRED',
          );
        } else {
          await tester.enterText(find.byType(TextField).first, 'Furniture');
          await tester.testTextInput.receiveAction(TextInputAction.search);
          await tester.pump();
          expect(openedCatalog, isTrue);
          final container = ProviderScope.containerOf(
            tester.element(find.byType(HomeScreen)),
          );
          expect(container.read(searchQueryProvider), 'Furniture');
        }
        expect(tester.takeException(), isNull);
        await tester.pumpWidget(const SizedBox());
      });
    }
  }

  test('Web and app design tokens agree on palette and control dimensions', () {
    expect(AppTheme.primarySky, const Color(0xFF0284C7));
    expect(AppTheme.lightBg, const Color(0xFFF8FAFC));
    expect(AppTheme.cardRadius, 16);
    final size = AppTheme.lightTheme.filledButtonTheme.style!.minimumSize!
        .resolve({});
    expect(size, const Size(44, 44));
  });
}
