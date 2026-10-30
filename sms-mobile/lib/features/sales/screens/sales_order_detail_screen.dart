import 'package:flutter/material.dart';
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
  String? _error;
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
        throw const FormatException('Sales order returned invalid data.');
      }
      setState(() {
        _order = responses[0].data as Map<String, dynamic>;
        _items = (responses[1].data as List).cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _error = 'Sales order unavailable: $error';
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
        title: Text(_order?['number']?.toString() ?? 'Sales Order'),
        actions: [
          IconButton(
            onPressed: _loadOrder,
            tooltip: 'Refresh',
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
                child: Text(_error!, textAlign: TextAlign.center),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: ListTile(
                    title: Text(
                      _order?['customerName']?.toString() ?? 'Customer',
                    ),
                    subtitle: Text('Status: ${_order?['status'] ?? 'Unknown'}'),
                  ),
                ),
                ..._items.map(
                  (item) => Card(
                    child: ListTile(
                      title: Text(item['variantName']?.toString() ?? 'Item'),
                      subtitle: Text('Quantity: ${item['quantity'] ?? 0}'),
                      trailing: Text(
                        'Rp ${(((item['finalPrice'] as num?)?.toDouble() ?? 0) * ((item['quantity'] as num?)?.toInt() ?? 0)).toStringAsFixed(0)}',
                      ),
                    ),
                  ),
                ),
                Card(
                  child: ListTile(
                    title: const Text('Quote total'),
                    trailing: Text(
                      'Rp ${total.toStringAsFixed(0)}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
