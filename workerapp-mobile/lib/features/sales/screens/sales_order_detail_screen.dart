import 'package:sms_mobile/core/localization/worker_message.dart';
import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import '../../../core/localization/worker_format.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';

class SalesOrderDetailScreen extends ConsumerStatefulWidget {
  final String salesOrderId;

  const SalesOrderDetailScreen({super.key, required this.salesOrderId});

  @override
  ConsumerState<SalesOrderDetailScreen> createState() =>
      _SalesOrderDetailScreenState();
}

class _SalesOrderDetailScreenState
    extends ConsumerState<SalesOrderDetailScreen> {
  Map<String, dynamic>? _order;
  List<Map<String, dynamic>> _items = [];
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
      final client = ref.read(apiClientProvider).dio;
      final responses = await Future.wait([
        client.get('/api/sales-orders/${widget.salesOrderId}'),
        client.get('/api/sales-orders/${widget.salesOrderId}/items'),
      ]);
      if (responses[0].data is! Map<String, dynamic> ||
          responses[1].data is! List) {
        throw WorkerMessage((l10n) => l10n.message400);
      }
      setState(() {
        _order = responses[0].data as Map<String, dynamic>;
        _items = (responses[1].data as List).cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _error = WorkerMessage(
          (l10n) => l10n.message401(localizedError(l10n, error)),
        );
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _items.fold<double>(
      0,
      (sum, item) =>
          sum +
          ((item['finalPrice'] as num?)?.toDouble() ?? 0) *
              ((item['quantity'] as num?)?.toInt() ?? 0),
    );
    return Scaffold(
      appBar: AppBar(
        title: Text(_order?['number']?.toString() ?? context.l10n.message402),
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
                    title: Text(
                      _order?['customerName']?.toString() ??
                          context.l10n.message403,
                    ),
                    subtitle: Text(
                      context.l10n.message404(
                        context.uiCode(
                          (_order?['status'] ?? 'Unknown').toString(),
                        ),
                      ),
                    ),
                  ),
                ),
                ..._items.map(
                  (item) => Card(
                    child: ListTile(
                      title: Text(
                        item['variantName']?.toString() ??
                            context.l10n.message405,
                      ),
                      subtitle: Text(
                        context.l10n.message406(
                          (item['quantity'] ?? 0).toString(),
                        ),
                      ),
                      trailing: Text(
                        context.rupiah(
                          ((item['finalPrice'] as num?)?.toDouble() ?? 0) *
                              ((item['quantity'] as num?)?.toInt() ?? 0),
                        ),
                      ),
                    ),
                  ),
                ),
                Card(
                  child: ListTile(
                    title: Text(context.l10n.message407),
                    trailing: Text(
                      context.rupiah(total),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
