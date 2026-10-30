import 'package:flutter/material.dart';
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
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get('/api/delivery-orders/${widget.deliveryOrderId}');
      if (response.data is! Map<String, dynamic>) {
        throw const FormatException('Delivery order returned invalid data.');
      }
      setState(() {
        _order = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _error = 'Delivery order unavailable: $error';
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
          order?['deliveryOrderNumber']?.toString() ?? 'Delivery Order',
        ),
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
                    leading: const Icon(
                      Icons.local_shipping_outlined,
                      color: AppColors.primary,
                    ),
                    title: Text(
                      order?['recipientName']?.toString() ?? 'Recipient',
                    ),
                    subtitle: Text(
                      '${order?['destinationAddress'] ?? ''}\n'
                      'Status: ${order?['status'] ?? 'Unknown'}',
                    ),
                    isThreeLine: true,
                  ),
                ),
                if (order?['failureReason'] != null)
                  Card(
                    color: AppColors.error.withValues(alpha: 0.08),
                    child: ListTile(
                      title: const Text('Failure reason'),
                      subtitle: Text(order!['failureReason'].toString()),
                    ),
                  ),
                const Padding(
                  padding: EdgeInsets.fromLTRB(4, 12, 4, 4),
                  child: Text(
                    'Packing manifest',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                ...items.map(
                  (item) => Card(
                    child: ListTile(
                      title: Text(
                        item['variantName']?.toString() ??
                            item['productName']?.toString() ??
                            'Product',
                      ),
                      subtitle: Text(
                        'Serial: ${item['manufacturerSerial'] ?? 'Not assigned'}',
                      ),
                      trailing: Text(item['status']?.toString() ?? ''),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
