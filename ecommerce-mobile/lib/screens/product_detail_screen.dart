import '../core/app_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../core/currency_formatter.dart';
import '../core/image_optimizer.dart';
import '../models/product_model.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import 'cart_screen.dart';
import '../widgets/flash_sale_banner.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final ProductSummary product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final p = widget.product;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppText.productDetails(context)),
        actions: [
          IconButton(
            icon: Icon(
              ref.watch(wishlistProvider).items.any((i) => i.productId == p.id)
                  ? Icons.favorite
                  : Icons.favorite_border,
              color:
                  ref
                      .watch(wishlistProvider)
                      .items
                      .any((i) => i.productId == p.id)
                  ? Color(0xFFF43F5E)
                  : null,
            ),
            tooltip: AppText.saveToWishlist(context),
            onPressed: () async {
              final added = await ref
                  .read(wishlistProvider.notifier)
                  .toggleWishlist(p);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      added
                          ? AppText.savedToWishlist(context, p.name)
                          : AppText.removedFromWishlist(context, p.name),
                    ),
                    backgroundColor: added
                        ? Color(0xFF059669)
                        : Colors.grey.shade800,
                    duration: Duration(seconds: 2),
                  ),
                );
              }
            },
          ),
          IconButton(icon: Icon(Icons.share_outlined), onPressed: () {}),
          IconButton(
            icon: Icon(Icons.shopping_cart_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => CartScreen()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Hero Image
            Container(
              height: 300,
              width: double.infinity,
              color: Color(0xFFF8FAFC),
              child: Image.network(
                ImageOptimizer.getOptimizedUrl(
                  p.primaryImageUrl,
                  preset: ImagePreset.hero,
                ),
                fit: BoxFit.cover,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return ImageOptimizer.buildLqipPlaceholder(
                    context,
                    p.primaryImageUrl,
                  );
                },
                errorBuilder: (context, error, stackTrace) => Center(
                  child: Icon(Icons.image, size: 64, color: Colors.grey),
                ),
              ),
            ),

            Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Brand & Category
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        p.brandName.toUpperCase(),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primarySky,
                          letterSpacing: 1.1,
                        ),
                      ),
                      Text(
                        p.categoryName,
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),

                  // Product Title
                  Text(
                    p.name,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.darkSlate,
                    ),
                  ),
                  SizedBox(height: 8),

                  // Price
                  Text(
                    CurrencyFormatter.format(p.minPrice, context),
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.darkSlate,
                    ),
                  ),
                  if (p.hasDiscount &&
                      p.originalMinPrice != null &&
                      p.originalMinPrice! > p.minPrice)
                    Padding(
                      padding: EdgeInsets.only(top: 3),
                      child: Text(
                        CurrencyFormatter.format(p.originalMinPrice!, context),
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ),
                  if (p.flashSale && p.flashSaleEndsAt != null) ...[
                    SizedBox(height: 10),
                    FlashSaleBanner(
                      endsAt: p.flashSaleEndsAt,
                      stockCount: p.inStockCount,
                    ),
                  ],
                  SizedBox(height: 12),

                  // Commercial Availability Pill (Dual Axis Foundation)
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: p.isReadyStock
                          ? Color(0xFFECFDF5)
                          : Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: p.isReadyStock
                            ? Color(0xFFA7F3D0)
                            : Color(0xFFBFDBFE),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          p.isReadyStock
                              ? Icons.check_circle
                              : Icons.inventory_2_outlined,
                          color: p.isReadyStock
                              ? Color(0xFF047857)
                              : Color(0xFF1D4ED8),
                          size: 18,
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                p.isReadyStock
                                    ? AppText.inStockAtTheShowroom(context)
                                    : AppText.preorderProcurementRequired(
                                        context,
                                      ),
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: p.isReadyStock
                                      ? Color(0xFF047857)
                                      : Color(0xFF1D4ED8),
                                ),
                              ),
                              Text(
                                p.isReadyStock
                                    ? AppText.readyForDeliveryTodayStorePickup(
                                        context,
                                      )
                                    : AppText.estimatedArrivalInBusinessDaysMinimum(
                                        context,
                                        p.leadTimeDays,
                                      ),
                                style: TextStyle(
                                  fontSize: 11,
                                  color: p.isReadyStock
                                      ? Color(0xFF065F46)
                                      : Color(0xFF1E40AF),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  SizedBox(height: 16),
                  Divider(),
                  SizedBox(height: 12),

                  // Description
                  Text(
                    AppText.productDescription(context),
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.darkSlate,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    p.description,
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF475569),
                      height: 1.5,
                    ),
                  ),

                  SizedBox(height: 16),

                  // Operational Assurances
                  Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.local_shipping_outlined,
                              color: AppTheme.primarySky,
                              size: 20,
                            ),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                AppText.ourDedicatedStoreFleetEnsuresYour(
                                  context,
                                ),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF334155),
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(
                              Icons.storefront_outlined,
                              color: Colors.orange,
                              size: 20,
                            ),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                AppText.collectDirectlyAtYourChosenStore(
                                  context,
                                ),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF334155),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  SizedBox(height: 24),

                  // Quantity Selector
                  Row(
                    children: [
                      Text(
                        AppText.quantity(context),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      SizedBox(width: 16),
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey.shade300),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: Icon(Icons.remove, size: 16),
                              onPressed: _quantity > 1
                                  ? () => setState(() => _quantity--)
                                  : null,
                            ),
                            Text(
                              formatArgument(context, _quantity),
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            IconButton(
                              icon: Icon(Icons.add, size: 16),
                              onPressed: () => setState(() => _quantity++),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppTheme.cardBorder)),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () {
                    ref
                        .read(cartProvider.notifier)
                        .addToCart(p, quantity: _quantity);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          AppText.itemSAddedToCart(context, _quantity, p.name),
                        ),
                        duration: Duration(seconds: 1),
                      ),
                    );
                  },
                  child: Text(
                    AppText.addToCart(context),
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: AppTheme.primarySky,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () async {
                    await ref
                        .read(cartProvider.notifier)
                        .addToCart(
                          p,
                          quantity: _quantity,
                          variantId: p.primaryVariantId,
                        );
                    if (context.mounted) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => CartScreen()),
                      );
                    }
                  },
                  child: Text(
                    AppText.buyNow(context),
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
