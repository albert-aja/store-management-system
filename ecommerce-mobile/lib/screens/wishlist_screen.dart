import '../core/currency_formatter.dart';
import '../core/app_text.dart';
import '../core/localized_errors.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../core/image_optimizer.dart';
import '../models/wishlist_model.dart';
import '../providers/wishlist_provider.dart';
import '../widgets/wishlist_share_panel.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wishlist = ref.watch(wishlistProvider);
    final error = ref.watch(wishlistErrorProvider);

    return Scaffold(
      backgroundColor: Color(0xFFF8FAFC),
      appBar: AppBar(
        bottom: error == null
            ? null
            : PreferredSize(
                preferredSize: Size.fromHeight(40),
                child: Padding(
                  padding: EdgeInsets.all(8),
                  child: Text(
                    localError(context, error),
                    style: TextStyle(color: Colors.red),
                  ),
                ),
              ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppText.wishlistSaved(context),
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                Icon(Icons.cloud_done, size: 12, color: Colors.green),
                SizedBox(width: 4),
                Text(
                  AppText.syncedAcrossWebMobile(context),
                  style: TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () => ref.read(wishlistProvider.notifier).loadWishlist(),
            tooltip: AppText.refreshWishlist(context),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(wishlistProvider.notifier).loadWishlist(),
        child: ListView(
          padding: EdgeInsets.all(16),
          children: [
            const WishlistSharePanel(),
            if (wishlist.items.isEmpty)
              SizedBox(height: 360, child: _buildEmptyState(context)),
            if (wishlist.items.isNotEmpty) ...[
              // Price Drop Banner (P.16 Indicator)
              if (wishlist.priceDropCount > 0)
                _buildPriceDropHero(context, wishlist),

              // Summary metrics
              _buildSyncMetricsRow(context, wishlist),
              SizedBox(height: 16),

              // Product List
              ...wishlist.items.map(
                (item) => _buildWishlistItemCard(context, ref, item),
              ),
              SizedBox(height: 24),

              // Footer info card
              _buildSyncInfoFooter(context),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPriceDropHero(BuildContext context, WishlistSummary summary) {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Color(0xFFECFDF5),
        border: Border.all(color: Color(0xFFD1FAE5)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 8,
            alignment: WrapAlignment.spaceBetween,
            children: [
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.trending_down,
                      size: 14,
                      color: Color(0xFF047857),
                    ),
                    SizedBox(width: 4),
                    Text(
                      AppText.priceDrop(context),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF047857),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                AppText.totalSavings(
                  context,
                  CurrencyFormatter.format(
                    summary.totalPotentialSavings,
                    context,
                  ),
                ),
                style: TextStyle(
                  color: Color(0xFF047857),
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          SizedBox(height: 10),
          Text(
            AppText.productsInYourWishlistHaveDropped(
              context,
              summary.priceDropCount,
            ),
            style: TextStyle(
              color: AppTheme.darkSlate,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 4),
          Text(
            AppText.pricesAreLowerThanWhenYou(context),
            style: TextStyle(color: AppTheme.mutedText, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildSyncMetricsRow(BuildContext context, WishlistSummary summary) {
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: EdgeInsets.symmetric(vertical: 12, horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Icon(Icons.favorite, color: Color(0xFFF43F5E), size: 22),
                SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      formatArgument(context, summary.totalItems),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      AppText.saved(context),
                      style: TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: EdgeInsets.symmetric(vertical: 12, horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Icon(Icons.cloud_sync, color: AppTheme.primarySky, size: 22),
                SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppText.cloudSync(context),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      AppText.webMobile(context),
                      style: TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildWishlistItemCard(
    BuildContext context,
    WidgetRef ref,
    WishlistItem item,
  ) {
    return Container(
      margin: EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: item.hasPriceDrop ? Color(0xFF10B981) : Color(0xFFE2E8F0),
          width: item.hasPriceDrop ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail with WebP optimizer & price drop overlay
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    children: [
                      SizedBox(
                        width: 90,
                        height: 90,
                        child: Image.network(
                          ImageOptimizer.getOptimizedUrl(
                            item.primaryImageUrl,
                            preset: ImagePreset.thumbnail,
                          ),
                          fit: BoxFit.cover,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return ImageOptimizer.buildLqipPlaceholder(
                              context,
                              item.primaryImageUrl,
                            );
                          },
                          errorBuilder: (context, error, stackTrace) => Center(
                            child: Icon(Icons.image, color: Colors.grey),
                          ),
                        ),
                      ),
                      if (item.hasPriceDrop)
                        Positioned(
                          top: 4,
                          left: 4,
                          child: Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Color(0xFF059669),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              '-${formatDecimal(context, item.priceDropPercentage, 1)}%',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                SizedBox(width: 12),

                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            item.brandName,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey,
                            ),
                          ),
                          InkWell(
                            onTap: () => ref
                                .read(wishlistProvider.notifier)
                                .removeItem(item.id),
                            child: Icon(
                              Icons.close,
                              size: 18,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 2),
                      Text(
                        item.productName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      SizedBox(height: 4),

                      // Availability Badge
                      Row(
                        children: [
                          Icon(
                            item.isReadyStock
                                ? Icons.check_circle
                                : Icons.schedule,
                            size: 12,
                            color: item.isReadyStock
                                ? Colors.green
                                : Colors.amber.shade800,
                          ),
                          SizedBox(width: 4),
                          Text(
                            item.isReadyStock
                                ? AppText.inStock(context)
                                : AppText.preorderDays(
                                    context,
                                    item.leadTimeDays,
                                  ),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: item.isReadyStock
                                  ? Colors.green.shade800
                                  : Colors.amber.shade900,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 6),

                      // Price Display
                      if (item.hasPriceDrop) ...[
                        Row(
                          children: [
                            Text(
                              CurrencyFormatter.format(
                                item.originalAddedPrice,
                                context,
                              ),
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                            SizedBox(width: 6),
                            Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 5,
                                vertical: 1,
                              ),
                              decoration: BoxDecoration(
                                color: Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                AppText.save(
                                  context,
                                  CurrencyFormatter.format(
                                    item.priceDropAmount,
                                    context,
                                  ),
                                ),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF059669),
                                ),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          CurrencyFormatter.format(item.currentPrice, context),
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF059669),
                          ),
                        ),
                      ] else ...[
                        Text(
                          CurrencyFormatter.format(item.currentPrice, context),
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),

            if (item.notes != null && item.notes!.isNotEmpty) ...[
              SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '"${item.notes}"',
                  style: TextStyle(
                    fontSize: 11,
                    fontStyle: FontStyle.italic,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),
            ],

            SizedBox(height: 8),

            // Price Drop Alert Setting (Exclusively in Mobile App - P.26)
            InkWell(
              onTap: () => _showPriceDropAlertModal(context, ref, item),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: item.notifyOnPriceDrop
                      ? Color(0xFFF0FDF4)
                      : Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: item.notifyOnPriceDrop
                        ? Color(0xFFBBF7D0)
                        : Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      item.notifyOnPriceDrop
                          ? Icons.notifications_active_outlined
                          : Icons.notifications_off_outlined,
                      size: 14,
                      color: item.notifyOnPriceDrop
                          ? Color(0xFF15803D)
                          : Color(0xFF94A3B8),
                    ),
                    SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        item.notifyOnPriceDrop
                            ? 'Alert: Turun >= ${item.alertDropThresholdPercent.toStringAsFixed(0)}%'
                            : 'Notifikasi Turun Harga: Nonaktif',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: item.notifyOnPriceDrop
                              ? Color(0xFF15803D)
                              : Color(0xFF64748B),
                        ),
                      ),
                    ),
                    Text(
                      'Atur Target',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0284C7),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            SizedBox(height: 10),
            Divider(height: 1, color: Color(0xFFF1F5F9)),
            SizedBox(height: 10),

            // Card Action Buttons
            Row(
              children: [
                // Move to Cart Button
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primarySky,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 0,
                    ),
                    icon: Icon(Icons.shopping_cart_outlined, size: 16),
                    label: Text(
                      AppText.moveToCart(context),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    onPressed: () async {
                      await ref
                          .read(wishlistProvider.notifier)
                          .moveToCart(item.id);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              AppText.movedToCart(context, item.productName),
                            ),
                            backgroundColor: Color(0xFF059669),
                            duration: Duration(seconds: 2),
                          ),
                        );
                      }
                    },
                  ),
                ),
                SizedBox(width: 8),

                // Simulate Price Drop Button
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Color(0xFF059669),
                    side: BorderSide(color: Color(0xFF10B981)),
                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: Icon(Icons.local_offer_outlined, size: 14),
                  label: Text(
                    AppText.simulateDiscount(context),
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () async {
                    await ref
                        .read(wishlistProvider.notifier)
                        .simulatePriceDrop(item.id);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            AppText.priceDropSimulationAppliedSuccessfully(
                              context,
                            ),
                          ),
                          backgroundColor: Color(0xFF059669),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    }
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Color(0xFFFFF1F2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.favorite_border,
                size: 64,
                color: Color(0xFFF43F5E),
              ),
            ),
            SizedBox(height: 20),
            Text(
              AppText.yourWishlistIsEmpty(context),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
            SizedBox(height: 8),
            Text(
              AppText.saveYourFavoriteTvsFridgesSofas(context),
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
            ),
            SizedBox(height: 24),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primarySky,
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: Icon(Icons.search),
              label: Text(
                AppText.exploreProducts(context),
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSyncInfoFooter(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.sync_alt, color: Color(0xFF475569), size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              AppText.pThisWishlistAutomaticallySyncsWith(context),
              style: TextStyle(fontSize: 11, color: Color(0xFF475569)),
            ),
          ),
        ],
      ),
    );
  }

  void _showPriceDropAlertModal(
    BuildContext context,
    WidgetRef ref,
    WishlistItem item,
  ) {
    bool isEnabled = item.notifyOnPriceDrop;
    double selectedThreshold = item.alertDropThresholdPercent;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final dropTargetPrice =
                item.originalAddedPrice * (1.0 - (selectedThreshold / 100.0));
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.notifications_active,
                            color: Color(0xFF0284C7),
                            size: 22,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Atur Notifikasi Turun Harga',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '📱 Eksklusif di Aplikasi Mobile',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1D4ED8),
                      ),
                    ),
                  ),
                  SizedBox(height: 12),
                  SwitchListTile.adaptive(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      'Notifikasi Penurunan Harga',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    subtitle: Text(
                      'Kirim push notification & email saat harga barang ini turun',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    value: isEnabled,
                    activeThumbColor: Color(0xFF059669),
                    onChanged: (val) {
                      setModalState(() {
                        isEnabled = val;
                      });
                    },
                  ),
                  if (isEnabled) ...[
                    SizedBox(height: 12),
                    Text(
                      'Pilih Minimal Penurunan Harga:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [5.0, 10.0, 15.0, 20.0, 25.0].map((pct) {
                        final isSelected =
                            (selectedThreshold - pct).abs() < 0.1;
                        return ChoiceChip(
                          label: Text(
                            '${pct.toInt()}%${pct == 5.0 ? " (Standar)" : ""}',
                          ),
                          selected: isSelected,
                          selectedColor: Color(0xFF059669),
                          labelStyle: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : Color(0xFF1E293B),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                          onSelected: (sel) {
                            if (sel) {
                              setModalState(() {
                                selectedThreshold = pct;
                              });
                            }
                          },
                        );
                      }).toList(),
                    ),
                    SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Estimasi Trigger Notifikasi:',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Harga Dasar: ${CurrencyFormatter.format(item.originalAddedPrice, context)}',
                            style: TextStyle(fontSize: 12),
                          ),
                          Text(
                            'Notifikasi dikirim saat harga <= ${CurrencyFormatter.format(dropTargetPrice, context)}',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF059669),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF0284C7),
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'Simpan Pengaturan',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await ref
                            .read(wishlistProvider.notifier)
                            .updateAlertSettings(
                              item.id,
                              notifyOnPriceDrop: isEnabled,
                              thresholdPercent: selectedThreshold,
                            );
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                'Pengaturan notifikasi harga wishlist berhasil disimpan.',
                              ),
                              backgroundColor: Color(0xFF059669),
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
