import '../core/app_text.dart';
import '../core/localized_errors.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../core/image_optimizer.dart';
import '../models/product_model.dart';
import '../providers/catalog_provider.dart';
import '../providers/notification_provider.dart';
import '../providers/wishlist_provider.dart';
import '../widgets/product_card.dart';
import 'catalog_screen.dart';
import 'notification_screen.dart';
import 'wishlist_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key, this.onOpenCatalog});
  final VoidCallback? onOpenCatalog;

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  Timer? _stockRefresh;

  @override
  void initState() {
    super.initState();
    _stockRefresh = Timer.periodic(Duration(seconds: 15), (_) {
      ref.invalidate(featuredProductsProvider);
    });
  }

  @override
  void dispose() {
    _stockRefresh?.cancel();
    super.dispose();
  }

  void _openCatalog({
    String query = '',
    String category = '',
    String availability = 'ALL',
  }) {
    ref.read(searchQueryProvider.notifier).setQuery(query);
    ref.read(categoryFilterProvider.notifier).setCategory(category);
    ref.read(availabilityFilterProvider.notifier).setFilter(availability);
    if (widget.onOpenCatalog != null) {
      widget.onOpenCatalog!();
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => CatalogScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final products = ref.watch(featuredProductsProvider);
    final unreadCount = ref.watch(unreadNotificationCountProvider);
    final wishlistCount = ref.watch(wishlistCountProvider);
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                color: AppTheme.primarySky,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.storefront, color: Colors.white, size: 20),
            ),
            SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppText.smsMart(context),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  Text(
                    AppText.retailLiving(context),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                      color: AppTheme.mutedText,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: AppText.wishlist(context),
            icon: Badge(
              isLabelVisible: wishlistCount > 0,
              label: Text('$wishlistCount'),
              backgroundColor: AppTheme.primarySky,
              child: Icon(Icons.favorite_border),
            ),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => WishlistScreen()),
            ),
          ),
          IconButton(
            tooltip: AppText.notifications(context),
            icon: Badge(
              isLabelVisible: unreadCount > 0,
              label: Text('$unreadCount'),
              backgroundColor: AppTheme.primarySky,
              child: Icon(Icons.notifications_none_outlined),
            ),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => NotificationScreen()),
            ),
          ),
          SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(featuredProductsProvider.future),
        child: ListView(
          padding: EdgeInsets.all(16),
          children: [
            TextField(
              decoration: InputDecoration(
                hintText: AppText.searchElectronicsFurniture(context),
                prefixIcon: Icon(Icons.search),
              ),
              textInputAction: TextInputAction.search,
              onSubmitted: (query) => _openCatalog(query: query.trim()),
            ),
            SizedBox(height: 20),
            _hero(products.value?.firstOrNull),
            SizedBox(height: 20),
            Row(
              children: [
                _trust(
                  Icons.verified_outlined,
                  AppText.officialWarranty(context),
                ),
                SizedBox(width: 8),
                _trust(
                  Icons.local_shipping_outlined,
                  AppText.homeDelivery(context),
                ),
                SizedBox(width: 8),
                _trust(Icons.storefront_outlined, AppText.storePickup(context)),
              ],
            ),
            SizedBox(height: 28),
            if (products.hasValue) ...[
              Text(
                AppText.featuredCategories(context),
                style: Theme.of(context).textTheme.titleLarge,
              ),
              SizedBox(height: 16),
              LayoutBuilder(
                builder: (context, constraints) {
                  final categories = products.value!
                      .map((product) => product.categoryName)
                      .toSet()
                      .take(4)
                      .toList();
                  final columns = constraints.maxWidth >= 700 ? 4 : 2;
                  return Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: categories
                        .map(
                          (category) => SizedBox(
                            width:
                                (constraints.maxWidth - 12 * (columns - 1)) /
                                columns,
                            child: Card(
                              child: InkWell(
                                borderRadius: BorderRadius.circular(12),
                                onTap: () => _openCatalog(category: category),
                                child: Padding(
                                  padding: EdgeInsets.all(12),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.category_outlined,
                                        size: 24,
                                        color: AppTheme.primarySky,
                                      ),
                                      SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          category,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  );
                },
              ),
              SizedBox(height: 28),
              if (products.value!.any((product) => product.flashSale)) ...[
                _sectionTitle(AppText.flashSale(context)),
                SizedBox(height: 12),
                ProductGrid(
                  products: products.value!
                      .where((product) => product.flashSale)
                      .take(4)
                      .toList(),
                ),
                SizedBox(height: 28),
              ],
            ],
            _sectionTitle(AppText.pickedForYou(context)),
            SizedBox(height: 12),
            products.when(
              data: (items) => ProductGrid(products: items.take(8).toList()),
              loading: () => Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (error, _) => Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  AppText.unableToLoadProducts(
                    context,
                    localError(context, error),
                  ),
                ),
              ),
            ),
            SizedBox(height: 28),
            Card(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.schedule, color: AppTheme.primarySky, size: 22),
                    SizedBox(height: 12),
                    Text(
                      AppText.moreChoicesWithPreorders(context),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    SizedBox(height: 6),
                    Text(
                      AppText.orderDistributorCollectionsWithTransparentDeposits(
                        context,
                      ),
                      style: TextStyle(color: AppTheme.mutedText),
                    ),
                    SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () => _openCatalog(
                        availability: 'AVAILABLE_PROCUREMENT_REQUIRED',
                      ),
                      icon: Icon(Icons.arrow_forward, size: 16),
                      label: Text(AppText.viewCollection(context)),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _hero(ProductSummary? product) {
    final copy = Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppText.retailLiving84(context),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.5,
              color: AppTheme.primaryDark,
            ),
          ),
          SizedBox(height: 12),
          Text(
            AppText.theRightChoiceForYourHome(context),
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          SizedBox(height: 12),
          Text(
            AppText.selectedElectronicsAndFurnitureOfficialWarranties(context),
            style: TextStyle(color: AppTheme.mutedText),
          ),
          SizedBox(height: 20),
          FilledButton.icon(
            onPressed: () => _openCatalog(),
            label: Text(AppText.browseCatalog(context)),
            icon: Icon(Icons.arrow_forward, size: 16),
          ),
        ],
      ),
    );
    final image = product == null
        ? null
        : AspectRatio(
            aspectRatio: 16 / 9,
            child: Image.network(
              ImageOptimizer.getOptimizedUrl(
                product.primaryImageUrl,
                preset: ImagePreset.hero,
              ),
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => ColoredBox(
                color: AppTheme.lightBg,
                child: Center(
                  child: Icon(
                    Icons.chair_outlined,
                    size: 48,
                    color: AppTheme.mutedText,
                  ),
                ),
              ),
            ),
          );
    return Card(
      clipBehavior: Clip.antiAlias,
      child: LayoutBuilder(
        builder: (context, constraints) =>
            constraints.maxWidth >= 700 && image != null
            ? Row(
                children: [
                  Expanded(child: copy),
                  Expanded(child: image),
                ],
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [copy, ?image],
              ),
      ),
    );
  }

  Widget _trust(IconData icon, String label) => Expanded(
    child: Card(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 4, vertical: 12),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.primarySky, size: 20),
            SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    ),
  );

  Widget _sectionTitle(String title) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Expanded(
        child: Text(title, style: Theme.of(context).textTheme.titleLarge),
      ),
      TextButton(
        onPressed: () => _openCatalog(),
        child: Text(AppText.viewAll(context)),
      ),
    ],
  );
}
