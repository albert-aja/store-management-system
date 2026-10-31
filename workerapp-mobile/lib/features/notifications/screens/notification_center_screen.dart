import 'package:sms_mobile/core/localization/worker_message.dart';
import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class NotificationCenterScreen extends ConsumerStatefulWidget {
  const NotificationCenterScreen({super.key});

  @override
  ConsumerState<NotificationCenterScreen> createState() =>
      _NotificationCenterScreenState();
}

class _NotificationCenterScreenState
    extends ConsumerState<NotificationCenterScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  WorkerMessage? _error;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get('/api/notifications');
      if (response.data is! List) {
        throw WorkerMessage((l10n) => l10n.message321);
      }
      setState(() {
        _notifications = (response.data as List).cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
        _error = WorkerMessage(
          (l10n) => l10n.message322(localizedError(l10n, error)),
        );
      });
    }
  }

  String? _deepLink(Map<String, dynamic> notification) {
    final type = notification['referenceType']?.toString().toUpperCase() ?? '';
    final id = notification['referenceId']?.toString();
    if (id == null) return null;
    if (type.contains('SURVEY')) return '/survey/$id';
    if (type.contains('DELIVERY')) return '/delivery-order/$id';
    if (type.contains('SALES_ORDER')) return '/sales-order/$id';
    if (type.contains('STOCKTAKE')) return '/stocktake-review/$id';
    return null;
  }

  Future<void> _open(Map<String, dynamic> notification) async {
    final recipientId = notification['recipientId']?.toString();
    if (recipientId != null && notification['readAt'] == null) {
      try {
        await ref
            .read(apiClientProvider)
            .dio
            .patch('/api/notifications/$recipientId/read');
      } catch (error) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(context.l10n.message323(context.errorText(error))),
            ),
          );
        }
      }
    }
    final path = _deepLink(notification);
    if (mounted && path != null) context.push(path);
  }

  Future<void> _decide(
    Map<String, dynamic> notification, {
    required bool approve,
  }) async {
    final requestId = notification['referenceId']?.toString();
    if (requestId == null) return;
    final client = ref.read(apiClientProvider).dio;
    try {
      final response = await client.get(
        '/api/approvals/requests/$requestId/steps',
      );
      if (response.data is! List) {
        throw WorkerMessage((l10n) => l10n.message324);
      }
      final pending = (response.data as List)
          .cast<Map<String, dynamic>>()
          .where((step) => step['status'] == 'PENDING')
          .firstOrNull;
      if (pending == null) {
        throw WorkerMessage((l10n) => l10n.message325);
      }
      final stepOrder = pending['stepOrder'];
      await client.post(
        '/api/approvals/requests/$requestId/steps/$stepOrder/decide',
        data: {
          'approve': approve,
          'comment': 'Decided from mobile notification',
        },
      );
      final recipientId = notification['recipientId']?.toString();
      if (recipientId != null) {
        await client.patch('/api/notifications/$recipientId/read');
      }
      await _loadNotifications();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              approve ? context.l10n.message327 : context.l10n.message328,
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message329(context.errorText(error))),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.message236),
        actions: [
          const WorkerLanguageSwitcher(),
          IconButton(
            onPressed: _loadNotifications,
            tooltip: context.l10n.message44,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      context.errorText(_error),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _loadNotifications,
                      child: Text(context.l10n.message330),
                    ),
                  ],
                ),
              ),
            )
          : _notifications.isEmpty
          ? Center(child: Text(context.l10n.message331))
          : RefreshIndicator(
              onRefresh: _loadNotifications,
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _notifications.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final notification = _notifications[index];
                  final unread = notification['readAt'] == null;
                  final isApproval =
                      (notification['referenceType']
                                  ?.toString()
                                  .toUpperCase() ??
                              '')
                          .contains('APPROVAL');
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(
                              isApproval
                                  ? Icons.fact_check_outlined
                                  : Icons.notifications_outlined,
                              color: unread
                                  ? AppColors.primary
                                  : AppColors.textSecondary,
                            ),
                            title: Text(
                              notification['title']?.toString() ??
                                  context.l10n.notification,
                              style: TextStyle(
                                fontWeight: unread
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                              ),
                            ),
                            subtitle: Text(
                              notification['body']?.toString() ?? '',
                            ),
                            onTap: () => _open(notification),
                          ),
                          Wrap(
                            alignment: WrapAlignment.end,
                            spacing: 8,
                            children: [
                              if (_deepLink(notification) != null)
                                TextButton(
                                  onPressed: () => _open(notification),
                                  child: Text(context.l10n.message332),
                                ),
                              if (isApproval) ...[
                                TextButton(
                                  onPressed: () =>
                                      _decide(notification, approve: false),
                                  child: Text(context.l10n.message333),
                                ),
                                FilledButton(
                                  onPressed: () =>
                                      _decide(notification, approve: true),
                                  child: Text(context.l10n.message334),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
