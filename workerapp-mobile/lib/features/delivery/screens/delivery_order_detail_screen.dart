import 'package:sms_mobile/core/localization/worker_message.dart';
import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import '../../../core/localization/worker_format.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class DeliveryOrderDetailScreen extends ConsumerStatefulWidget {
  final String deliveryOrderId;

  const DeliveryOrderDetailScreen({super.key, required this.deliveryOrderId});

  @override
  ConsumerState<DeliveryOrderDetailScreen> createState() =>
      _DeliveryOrderDetailScreenState();
}

class _DeliveryOrderDetailScreenState
    extends ConsumerState<DeliveryOrderDetailScreen> {
  Map<String, dynamic>? _order;
  WorkerMessage? _error;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get('/api/delivery-orders/${widget.deliveryOrderId}');
      if (response.data is! Map<String, dynamic>) {
        throw WorkerMessage((l10n) => l10n.message164);
      }
      setState(() {
        _order = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _error = WorkerMessage(
          (l10n) => l10n.message165(localizedError(l10n, error)),
        );
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = _order;
    final items =
        (order?['items'] as List<dynamic>?)
            ?.whereType<Map<String, dynamic>>()
            .toList() ??
        [];
    return Scaffold(
      appBar: AppBar(
        title: Text(
          order?['deliveryOrderNumber']?.toString() ?? context.l10n.message166,
        ),
        actions: [
          const WorkerLanguageSwitcher(),
          IconButton(
            onPressed: _loadOrder,
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
                child: Text(
                  context.errorText(_error),
                  textAlign: TextAlign.center,
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: ListTile(
                    leading: const Icon(
                      Icons.local_shipping_outlined,
                      color: AppColors.primary,
                    ),
                    title: Text(
                      order?['recipientName']?.toString() ??
                          context.l10n.recipient,
                    ),
                    subtitle: Text(
                      context.l10n.message167(
                        (order?['destinationAddress'] ?? '').toString(),
                        context.uiCode(
                          (order?['status'] ?? 'Unknown').toString(),
                        ),
                      ),
                    ),
                    isThreeLine: true,
                  ),
                ),
                if (order?['failureReason'] != null)
                  Card(
                    color: AppColors.error.withValues(alpha: 0.08),
                    child: ListTile(
                      title: Text(context.l10n.message168),
                      subtitle: Text(order!['failureReason'].toString()),
                    ),
                  ),
                Padding(
                  padding: EdgeInsets.fromLTRB(4, 12, 4, 4),
                  child: Text(
                    context.l10n.message169,
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                ...items.map(
                  (item) => Card(
                    child: ListTile(
                      title: Text(
                        item['variantName']?.toString() ??
                            item['productName']?.toString() ??
                            context.l10n.message170,
                      ),
                      subtitle: Text(
                        context.l10n.message171(
                          (item['manufacturerSerial'] ??
                                  context.l10n.notAssigned)
                              .toString(),
                        ),
                      ),
                      trailing: Text(
                        context.uiCode(item['status']?.toString() ?? ''),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
