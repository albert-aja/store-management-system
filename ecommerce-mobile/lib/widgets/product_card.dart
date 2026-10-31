import '../core/app_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../core/currency_formatter.dart';
import '../core/image_optimizer.dart';
import '../models/product_model.dart';
import '../providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';
import '../screens/product_detail_screen.dart';
import 'flash_sale_banner.dart';

class ProductGrid extends StatelessWidget {
  const ProductGrid({
    super.key,
    required this.products,
    this.scrollable = false,
  });
  final List<ProductSummary> products;
  final bool scrollable;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final width = constraints.maxWidth;
      final columns = width >= 992
          ? 4
          : width >= 736
          ? 3
          : width < 280
          ? 1
          : 2;
      const gap = 12.0;
      final cardWidth = (width - gap * (columns - 1)) / columns;
      final scale = MediaQuery.textScalerOf(context).scale(14) / 14;
      return GridView.builder(
        shrinkWrap: !scrollable,
        physics: scrollable
            ? AlwaysScrollableScrollPhysics()
            : NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: columns,
          mainAxisSpacing: gap,
          crossAxisSpacing: gap,
          mainAxisExtent:
              cardWidth * 0.75 +
              250 * scale +
              (products.any((product) => product.flashSale) ? 132 * scale : 0),
        ),
        itemCount: products.length,
        itemBuilder: (context, index) => ProductCard(product: products[index]),
      );
    },
  );
}

class ProductCard extends ConsumerStatefulWidget {
  const ProductCard({super.key, required this.product});
  final ProductSummary product;

  @override
  ConsumerState<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends ConsumerState<ProductCard> {
  bool _busy = false;

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _busy = true);
    try {
      await action();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppText.unableToSaveChangesPleaseTry(context)),
          ),
        );
      }
      debugPrint('Product action failed: $error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _open() => Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => ProductDetailScreen(product: widget.product),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final wishlisted = ref
        .watch(wishlistProvider)
        .items
        .any((item) => item.productId == product.id);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              InkWell(
                onTap: _open,
                child: AspectRatio(
                  aspectRatio: 4 / 3,
                  child: Image.network(
                    ImageOptimizer.getOptimizedUrl(
                      product.primaryImageUrl,
                      preset: ImagePreset.card,
                    ),
                    fit: BoxFit.cover,
                    semanticLabel: product.name,
                    loadingBuilder: (context, child, progress) =>
                        progress == null
                        ? child
                        : ImageOptimizer.buildLqipPlaceholder(
                            context,
                            product.primaryImageUrl,
                          ),
                    errorBuilder: (_, _, _) => ColoredBox(
                      color: AppTheme.lightBg,
                      child: Center(
                        child: Icon(
                          Icons.image_outlined,
                          color: AppTheme.mutedText,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: IconButton.filledTonal(
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: wishlisted
                        ? Colors.red
                        : AppTheme.mutedText,
                  ),
                  tooltip: wishlisted
                      ? AppText.removeFromWishlist(context)
                      : AppText.saveToWishlist(context),
                  iconSize: 18,
                  onPressed: _busy
                      ? null
                      : () => _run(() async {
                          await ref
                              .read(wishlistProvider.notifier)
                              .toggleWishlist(product);
                        }),
                  icon: Icon(
                    wishlisted ? Icons.favorite : Icons.favorite_border,
                  ),
                ),
              ),
              if (product.hasDiscount)
                Positioned(
                  left: 8,
                  top: 8,
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '-${formatArgument(context, product.maxDiscountPercent)}%',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.red,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          Expanded(
            child: Padding(
              padding: EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${product.brandName} · ${product.categoryName}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12, color: AppTheme.mutedText),
                  ),
                  SizedBox(height: 6),
                  InkWell(
                    onTap: _open,
                    child: Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.4,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  SizedBox(height: 10),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    decoration: BoxDecoration(
                      color: product.isReadyStock
                          ? Color(0xFFECFDF5)
                          : Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      product.isReadyStock
                          ? AppText.inStock(context)
                          : AppText.preorderDays249(
                              context,
                              product.leadTimeDays,
                            ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: product.isReadyStock
                            ? Color(0xFF047857)
                            : Color(0xFF1D4ED8),
                      ),
                    ),
                  ),
                  if (product.flashSale) ...[
                    SizedBox(height: 8),
                    FlashSaleBanner(
                      endsAt: product.flashSaleEndsAt,
                      stockCount: product.inStockCount,
                    ),
                  ],
                  Spacer(),
                  if (product.hasDiscount &&
                      product.originalMinPrice != null &&
                      product.originalMinPrice! > product.minPrice)
                    Text(
                      CurrencyFormatter.format(
                        product.originalMinPrice!,
                        context,
                      ),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.mutedText,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                  Text(
                    CurrencyFormatter.format(product.minPrice, context),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.3,
                    ),
                  ),
                  SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 10,
                        ),
                        backgroundColor: AppTheme.softPrimary,
                        foregroundColor: AppTheme.primaryDark,
                        side: BorderSide(color: Color(0xFFE0F2FE)),
                      ),
                      onPressed: _busy
                          ? null
                          : () => _run(() async {
                              await ref
                                  .read(cartProvider.notifier)
                                  .addToCart(
                                    product,
                                    variantId: product.primaryVariantId,
                                  );
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      AppText.productAddedToCart(context),
                                    ),
                                  ),
                                );
                              }
                            }),
                      icon: Icon(Icons.add, size: 16),
                      label: Text(
                        _busy
                            ? AppText.processing(context)
                            : AppText.add(context),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
