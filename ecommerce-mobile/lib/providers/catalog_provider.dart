import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../models/product_model.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class SearchQueryNotifier extends Notifier<String> {
  @override
  String build() => '';
  void setQuery(String val) => state = val;
}

final searchQueryProvider = NotifierProvider<SearchQueryNotifier, String>(
  SearchQueryNotifier.new,
);

class AvailabilityFilterNotifier extends Notifier<String> {
  @override
  String build() => 'ALL';
  void setFilter(String val) => state = val;
}

final availabilityFilterProvider =
    NotifierProvider<AvailabilityFilterNotifier, String>(
      AvailabilityFilterNotifier.new,
    );

class CategoryFilterNotifier extends Notifier<String> {
  @override
  String build() => '';
  void setCategory(String value) => state = value;
}

final categoryFilterProvider = NotifierProvider<CategoryFilterNotifier, String>(
  CategoryFilterNotifier.new,
);

class SortOrderNotifier extends Notifier<String> {
  @override
  String build() => 'DEFAULT';
  void setOrder(String value) => state = value;
}

final sortOrderProvider = NotifierProvider<SortOrderNotifier, String>(
  SortOrderNotifier.new,
);

final featuredProductsProvider = FutureProvider<List<ProductSummary>>(
  (ref) => ref.watch(apiClientProvider).getProducts(),
);

final catalogCategoriesProvider = FutureProvider<List<String>>((ref) async {
  final products = await ref.watch(featuredProductsProvider.future);
  return products.map((product) => product.categoryName).toSet().toList()
    ..sort();
});

final productsProvider = FutureProvider<List<ProductSummary>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final query = ref.watch(searchQueryProvider);
  final availability = ref.watch(availabilityFilterProvider);
  final category = ref.watch(categoryFilterProvider);
  final order = ref.watch(sortOrderProvider);

  final products = await api.getProducts(
    query: query,
    availability: availability,
  );
  final result = products
      .where((product) => category.isEmpty || product.categoryName == category)
      .toList();
  if (order == 'PRICE_LOW') {
    result.sort((a, b) => a.minPrice.compareTo(b.minPrice));
  }
  if (order == 'PRICE_HIGH') {
    result.sort((a, b) => b.minPrice.compareTo(a.minPrice));
  }
  return result;
});
