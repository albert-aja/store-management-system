import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/notification_model.dart';
import 'catalog_provider.dart';

class NotificationNotifier extends Notifier<List<NotificationItem>> {
  @override
  List<NotificationItem> build() {
    Future.microtask(() => loadNotifications());
    return [];
  }

  Future<void> loadNotifications() async {
    final api = ref.read(apiClientProvider);
    final items = await api.getNotifications();
    state = items;
  }

  Future<void> markAsRead(String id) async {
    final api = ref.read(apiClientProvider);
    await api.markNotificationAsRead(id);
    state = state.map((n) {
      if (n.id == id) {
        n.isRead = true;
      }
      return n;
    }).toList();
  }

  Future<void> triggerMilestone({
    required String orderNumber,
    required String milestoneType,
    Map<String, dynamic>? metadata,
  }) async {
    final api = ref.read(apiClientProvider);
    final notif = await api.triggerMilestoneNotification(
      orderNumber: orderNumber,
      milestoneType: milestoneType,
      metadata: metadata,
    );
    state = [notif, ...state];
  }
}

final notificationsProvider =
    NotifierProvider<NotificationNotifier, List<NotificationItem>>(
      NotificationNotifier.new,
    );

final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifs = ref.watch(notificationsProvider);
  return notifs.where((n) => !n.isRead).length;
});
