import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ecommerce_mobile/models/product_model.dart';
import 'package:ecommerce_mobile/screens/ar_furniture_preview_screen.dart';
import 'package:ecommerce_mobile/screens/product_detail_screen.dart';

Widget createTestApp(Widget child) {
  return ProviderScope(
    child: MaterialApp(
      locale: const Locale('id'),
      supportedLocales: const [Locale('id'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: child,
    ),
  );
}

void main() {
  final sofaProduct = ProductSummary(
    id: 'sofa-1',
    name: 'Sofa Bed L-Shape Scandinavian 3 Seater',
    code: 'FURN-SOFA-01',
    description: 'Sofa bed minimalis modern',
    brandName: 'Comfort Living',
    categoryName: 'Furniture & Living',
    minPrice: 4500000,
    maxPrice: 4500000,
    primaryImageUrl: 'https://example.com/sofa.jpg',
    commercialAvailability: 'IN_STOCK',
    leadTimeDays: 1,
    inStockCount: 5,
  );

  final tvProduct = ProductSummary(
    id: 'tv-1',
    name: 'Smart TV 55 Inch 4K UHD',
    code: 'ELEC-TV-01',
    description: 'Smart TV UHD',
    brandName: 'Samsung',
    categoryName: 'Elektronik & TV',
    minPrice: 6500000,
    maxPrice: 6500000,
    primaryImageUrl: 'https://example.com/tv.jpg',
    commercialAvailability: 'IN_STOCK',
    leadTimeDays: 1,
    inStockCount: 3,
  );

  test('ProductSummary correctly detects furniture category for AR trigger', () {
    expect(sofaProduct.isFurniture, isTrue);
    expect(tvProduct.isFurniture, isFalse);
  });

  testWidgets('ProductDetailScreen displays AR Room Preview button for furniture', (tester) async {
    await tester.pumpWidget(createTestApp(ProductDetailScreen(product: sofaProduct)));
    await tester.pumpAndSettle();

    expect(find.textContaining('Lihat di Ruangan Anda (3D / AR)'), findsOneWidget);
  });

  testWidgets('ArFurniturePreviewScreen renders 3D viewport, dimensions, and swatch options', (tester) async {
    await tester.pumpWidget(createTestApp(ArFurniturePreviewScreen(product: sofaProduct)));
    await tester.pumpAndSettle();

    expect(find.textContaining('Pratinjau Ruangan 3D & AR'), findsOneWidget);
    expect(find.textContaining('210 × 90 × 85 cm'), findsOneWidget);
    expect(find.text('Charcoal Grey'), findsOneWidget);
    expect(find.text('Cream White'), findsOneWidget);

    // Zoom and camera controls exist
    expect(find.byIcon(Icons.zoom_in), findsOneWidget);
    expect(find.byIcon(Icons.zoom_out), findsOneWidget);
    expect(find.text('Lihat Kamera AR'), findsOneWidget);
  });

  testWidgets('Tapping Lihat Kamera AR switches to camera mode', (tester) async {
    await tester.pumpWidget(createTestApp(ArFurniturePreviewScreen(product: sofaProduct)));
    await tester.pumpAndSettle();

    final cameraBtn = find.text('Lihat Kamera AR');
    await tester.tap(cameraBtn);
    await tester.pumpAndSettle();

    expect(find.text('Arahkan ke Lantai Ruangan'), findsOneWidget);
    expect(find.text('Kembali ke 3D'), findsOneWidget);
  });

  testWidgets('Tapping ruler button opens Room Clearance BottomSheet', (tester) async {
    await tester.pumpWidget(createTestApp(ArFurniturePreviewScreen(product: sofaProduct)));
    await tester.pumpAndSettle();

    final rulerBtn = find.byIcon(Icons.straighten_outlined);
    await tester.tap(rulerBtn);
    await tester.pumpAndSettle();

    expect(find.textContaining('Cek Ukuran Ruangan'), findsOneWidget);
    expect(find.textContaining('Panjang Ruangan (cm)'), findsOneWidget);
    expect(find.textContaining('Lebar Ruangan (cm)'), findsOneWidget);
    expect(find.textContaining('Muat di Ruangan'), findsOneWidget);
  });
}
