import '../core/app_text.dart';
import '../core/localized_errors.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../providers/catalog_provider.dart';
import '../widgets/product_card.dart';
import 'wishlist_screen.dart';
import 'cart_screen.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key});

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  final _search = TextEditingController();
  Timer? _stockRefresh;

  @override
  void initState() {
    super.initState();
    _search.text = ref.read(searchQueryProvider);
    _stockRefresh = Timer.periodic(
      Duration(seconds: 15),
      (_) => ref.invalidate(productsProvider),
    );
  }

  @override
  void dispose() {
    _search.dispose();
    _stockRefresh?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(searchQueryProvider, (_, query) {
      if (_search.text != query) _search.text = query;
    });
    final products = ref.watch(productsProvider);
    final availability = ref.watch(availabilityFilterProvider);
    final category = ref.watch(categoryFilterProvider);
    final order = ref.watch(sortOrderProvider);
    final categories = ref.watch(catalogCategoriesProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(AppText.productCatalog(context)),
        actions: [
          IconButton(
            tooltip: AppText.wishlist(context),
            icon: Icon(Icons.favorite_border),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => WishlistScreen()),
            ),
          ),
          IconButton(
            tooltip: AppText.cart(context),
            icon: Icon(Icons.shopping_cart_outlined),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => CartScreen()),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(16),
            child: Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  children: [
                    TextField(
                      controller: _search,
                      decoration: InputDecoration(
                        hintText: AppText.searchElectronicsFurniture(context),
                        prefixIcon: Icon(Icons.search, size: 20),
                        suffixIcon: _search.text.isEmpty
                            ? null
                            : IconButton(
                                tooltip: AppText.clearSearch(context),
                                icon: Icon(Icons.close, size: 18),
                                onPressed: () => ref
                                    .read(searchQueryProvider.notifier)
                                    .setQuery(''),
                              ),
                      ),
                      onChanged: (query) => ref
                          .read(searchQueryProvider.notifier)
                          .setQuery(query),
                    ),
                    SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            key: ValueKey('category-$category'),
                            initialValue:
                                categories.value?.contains(category) == true
                                ? category
                                : '',
                            isExpanded: true,
                            decoration: InputDecoration(
                              labelText: AppText.category(context),
                            ),
                            items: [
                              DropdownMenuItem(
                                value: '',
                                child: Text(AppText.all(context)),
                              ),
                              ...?categories.value?.map(
                                (value) => DropdownMenuItem(
                                  value: value,
                                  child: Text(
                                    value,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                            ],
                            onChanged: (value) => ref
                                .read(categoryFilterProvider.notifier)
                                .setCategory(value ?? ''),
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: order,
                            isExpanded: true,
                            decoration: InputDecoration(
                              labelText: AppText.sort(context),
                            ),
                            items: [
                              DropdownMenuItem(
                                value: 'DEFAULT',
                                child: Text(AppText.recommended(context)),
                              ),
                              DropdownMenuItem(
                                value: 'PRICE_LOW',
                                child: Text(AppText.lowestPrice(context)),
                              ),
                              DropdownMenuItem(
                                value: 'PRICE_HIGH',
                                child: Text(AppText.highestPrice(context)),
                              ),
                            ],
                            onChanged: (value) => ref
                                .read(sortOrderProvider.notifier)
                                .setOrder(value ?? 'DEFAULT'),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 12),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _filter('ALL', AppText.all(context), availability),
                          SizedBox(width: 8),
                          _filter(
                            'IN_STOCK',
                            AppText.inStock(context),
                            availability,
                          ),
                          SizedBox(width: 8),
                          _filter(
                            'AVAILABLE_PROCUREMENT_REQUIRED',
                            AppText.preorder(context),
                            availability,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: products.when(
                data: (items) => items.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.search_off,
                              size: 40,
                              color: AppTheme.mutedText,
                            ),
                            SizedBox(height: 12),
                            Text(AppText.noMatchingProducts(context)),
                            SizedBox(height: 4),
                            Text(
                              AppText.tryAnotherKeywordOrCategory(context),
                              style: TextStyle(color: AppTheme.mutedText),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => ref.refresh(productsProvider.future),
                        child: ProductGrid(products: items, scrollable: true),
                      ),
                loading: () => Center(child: CircularProgressIndicator()),
                error: (error, _) => Center(
                  child: Text(
                    AppText.unableToLoadCatalog(
                      context,
                      localError(context, error),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _filter(String value, String label, String selected) => ChoiceChip(
    label: Text(label),
    selected: value == selected,
    onSelected: (_) =>
        ref.read(availabilityFilterProvider.notifier).setFilter(value),
  );
}
