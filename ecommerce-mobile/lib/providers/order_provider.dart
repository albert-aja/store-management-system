import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/order_model.dart';
import 'catalog_provider.dart';

final ordersListProvider = FutureProvider<List<OrderDetail>>((ref) async {
  final api = ref.watch(apiClientProvider);
  return api.getOrders();
});

class CurrentOrderNotifier extends Notifier<OrderDetail?> {
  @override
  OrderDetail? build() => null;
  void setOrder(OrderDetail? order) => state = order;
}

final currentOrderProvider =
    NotifierProvider<CurrentOrderNotifier, OrderDetail?>(
      CurrentOrderNotifier.new,
    );
