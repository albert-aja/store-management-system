import '../core/app_text.dart';
import '../core/localized_errors.dart';
import '../core/notification_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/app_theme.dart';
import '../models/notification_model.dart';
import '../providers/notification_provider.dart';
import 'order_tracking_screen.dart';

class NotificationScreen extends ConsumerStatefulWidget {
  const NotificationScreen({super.key});

  @override
  ConsumerState<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends ConsumerState<NotificationScreen> {
  String _activeFilter = 'ALL'; // ALL, UNREAD, DEPOSIT, DELIVERY

  @override
  Widget build(BuildContext context) {
    final notifications = ref.watch(notificationsProvider);

    List<NotificationItem> filtered = notifications;
    if (_activeFilter == 'UNREAD') {
      filtered = filtered.where((n) => !n.isRead).toList();
    } else if (_activeFilter == 'DEPOSIT') {
      filtered = filtered
          .where((n) => n.milestoneType == 'DEPOSIT_CONFIRMED')
          .toList();
    } else if (_activeFilter == 'DELIVERY') {
      filtered = filtered
          .where(
            (n) =>
                n.milestoneType == 'DRIVER_EN_ROUTE' ||
                n.milestoneType == 'STORE_PICKUP_READY',
          )
          .toList();
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          AppText.orderNotifications(context),
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            tooltip: AppText.markAllAsRead(context),
            icon: Icon(Icons.done_all),
            onPressed: () {
              for (final n in notifications) {
                if (!n.isRead) {
                  ref.read(notificationsProvider.notifier).markAsRead(n.id);
                }
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('ALL', AppText.all(context)),
                  SizedBox(width: 8),
                  _buildFilterChip('UNREAD', AppText.unread(context)),
                  SizedBox(width: 8),
                  _buildFilterChip('DEPOSIT', AppText.payment(context)),
                  SizedBox(width: 8),
                  _buildFilterChip('DELIVERY', AppText.deliveryPickup(context)),
                ],
              ),
            ),
          ),

          Divider(height: 1),

          // List
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.notifications_off_outlined,
                          size: 54,
                          color: Colors.grey.shade400,
                        ),
                        SizedBox(height: 12),
                        Text(
                          AppText.noNotificationsYet(context),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          AppText.orderMilestoneNotificationsWillAppearHere(
                            context,
                          ),
                          style: TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (context, index) => SizedBox(height: 12),
                    itemBuilder: (context, idx) {
                      final item = filtered[idx];
                      return _buildNotificationCard(context, ref, item);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final isSelected = _activeFilter == filterKey;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) setState(() => _activeFilter = filterKey);
      },
      selectedColor: AppTheme.primarySky,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: isSelected ? Colors.white : Color(0xFF475569),
      ),
      backgroundColor: Color(0xFFF1F5F9),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    );
  }

  Widget _buildNotificationCard(
    BuildContext context,
    WidgetRef ref,
    NotificationItem item,
  ) {
    return InkWell(
      onTap: () {
        if (!item.isRead) {
          ref.read(notificationsProvider.notifier).markAsRead(item.id);
        }
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: item.isRead ? Colors.white : Color(0xFFF0F9FF),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: item.isRead
                ? AppTheme.cardBorder
                : AppTheme.primarySky.withValues(alpha: 0.3),
            width: item.isRead ? 1 : 1.5,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon Avatar
            Container(
              padding: EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: item.badgeColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(item.iconData, color: item.badgeColor, size: 22),
            ),
            SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 7,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: item.badgeColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          businessLabel(context, item.milestoneType),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: item.badgeColor,
                          ),
                        ),
                      ),
                      Text(
                        _formatTime(item.sentAt),
                        style: TextStyle(fontSize: 10, color: Colors.grey),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                  Text(
                    notificationTitle(context, item),
                    style: TextStyle(
                      fontWeight: item.isRead
                          ? FontWeight.bold
                          : FontWeight.w900,
                      fontSize: 13,
                      color: AppTheme.darkSlate,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    notificationBody(context, item),
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF475569),
                      height: 1.3,
                    ),
                  ),
                  SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item.orderNumber,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                          color: AppTheme.primarySky,
                        ),
                      ),
                      InkWell(
                        onTap: () {
                          if (!item.isRead) {
                            ref
                                .read(notificationsProvider.notifier)
                                .markAsRead(item.id);
                          }
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => OrderTrackingScreen(
                                initialOrderNumber: item.orderNumber,
                              ),
                            ),
                          );
                        },
                        child: Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          child: Row(
                            children: [
                              Text(
                                AppText.trackOrder(context),
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primarySky,
                                ),
                              ),
                              SizedBox(width: 2),
                              Icon(
                                Icons.chevron_right,
                                size: 14,
                                color: AppTheme.primarySky,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) {
      return AppText.mAgo(context, diff.inMinutes);
    } else if (diff.inHours < 24) {
      return AppText.hAgo(context, diff.inHours);
    } else {
      return AppText.dAgo(context, diff.inDays);
    }
  }
}
