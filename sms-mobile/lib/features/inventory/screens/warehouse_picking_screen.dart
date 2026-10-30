import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/hardware/barcode_scanner_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../../delivery/models/delivery_model.dart';

class WarehousePickingScreen extends ConsumerStatefulWidget {
  const WarehousePickingScreen({super.key});

  @override
  ConsumerState<WarehousePickingScreen> createState() =>
      _WarehousePickingScreenState();
}

class _WarehousePickingScreenState
    extends ConsumerState<WarehousePickingScreen> {
  List<DeliveryOrderModel> _orders = [];
  final Map<String, Set<String>> _scannedByOrder = {};
  final Set<String> _verifiedOrders = {};
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadManifest();
  }

  Future<void> _loadManifest() async {
    final storeId = ref.read(authProvider).user?.storeId;
    if (storeId == null) {
      setState(() {
        _isLoading = false;
        _error = 'Your profile has no store assignment.';
      });
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get(
            '/api/delivery-orders/picking-manifest',
            queryParameters: {'storeId': storeId},
          );
      if (response.data is! List) {
        throw const FormatException('Picking manifest returned invalid data.');
      }
      if (!mounted) return;
      setState(() {
        _orders = (response.data as List)
            .cast<Map<String, dynamic>>()
            .map(DeliveryOrderModel.fromJson)
            .toList();
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = 'Picking manifest unavailable: $error';
      });
    }
  }

  Future<void> _scan(DeliveryOrderModel order) async {
    final expected = order.manifestSerials.toSet();
    if (expected.isEmpty) {
      setState(
        () => _error =
            'No stock-unit serials assigned to ${order.deliveryOrderNumber}.',
      );
      return;
    }
    final serial = await showDialog<String>(
      context: context,
      builder: (_) => BarcodeScannerModal(
        title: 'Verify Packing Manifest',
        prompt:
            'Scan ${expected.length} stock-unit serial(s) for ${order.deliveryOrderNumber}',
      ),
    );
    if (!mounted || serial == null || serial.trim().isEmpty) return;
    final normalized = serial.trim();
    if (!expected.contains(normalized)) {
      setState(
        () => _error =
            'Unexpected serial for ${order.deliveryOrderNumber}: $normalized',
      );
      return;
    }

    final scanned = _scannedByOrder.putIfAbsent(order.id, () => <String>{});
    if (!scanned.add(normalized)) {
      setState(() => _error = 'Duplicate scan ignored: $normalized');
      return;
    }
    setState(() => _error = null);

    if (scanned.containsAll(expected)) {
      await _submitVerification(order, scanned.toList());
    }
  }

  Future<void> _submitVerification(
    DeliveryOrderModel order,
    List<String> scanned,
  ) async {
    try {
      final response = await ref
          .read(apiClientProvider)
          .dio
          .post(
            '/api/delivery-orders/${order.id}/packing-verification',
            data: {'scannedSerials': scanned},
          );
      if (response.data is! Map<String, dynamic> ||
          response.data['preInspectionPassed'] != true) {
        throw const FormatException(
          'Server did not confirm packing verification.',
        );
      }
      if (!mounted) return;
      setState(() {
        _verifiedOrders.add(order.id);
        _orders = _orders
            .map(
              (current) => current.id == order.id
                  ? DeliveryOrderModel.fromJson(
                      response.data as Map<String, dynamic>,
                    )
                  : current,
            )
            .toList();
        _error = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${order.deliveryOrderNumber} packing verified.'),
        ),
      );
    } catch (error) {
      if (mounted) {
        setState(() => _error = 'Packing verification failed: $error');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final verifiedCount = _orders
        .where(
          (order) =>
              _verifiedOrders.contains(order.id) || order.preInspectionPassed,
        )
        .length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Guided Picking & Packing'),
        actions: [
          IconButton(
            tooltip: 'Refresh manifests',
            onPressed: _isLoading ? null : _loadManifest,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: AppColors.primary.withValues(alpha: 0.06),
                  child: Text(
                    '$verifiedCount / ${_orders.length} manifests verified',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                if (_error != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    color: AppColors.error.withValues(alpha: 0.08),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: AppColors.error),
                    ),
                  ),
                Expanded(
                  child: _orders.isEmpty
                      ? const Center(
                          child: Text('No pending delivery manifests.'),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _orders.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final order = _orders[index];
                            final scanned =
                                _scannedByOrder[order.id] ?? const <String>{};
                            final verified =
                                _verifiedOrders.contains(order.id) ||
                                order.preInspectionPassed;
                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    Text(
                                      order.deliveryOrderNumber,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(order.itemName ?? 'Product manifest'),
                                    Text('Customer: ${order.recipientName}'),
                                    Text(
                                      'Expected units: ${order.manifestSerials.length}',
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Icon(
                                          verified
                                              ? Icons.check_circle
                                              : Icons.qr_code_scanner,
                                          color: verified
                                              ? AppColors.secondary
                                              : AppColors.textSecondary,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            verified
                                                ? 'Manifest verified'
                                                : '${scanned.length} / ${order.manifestSerials.length} scanned',
                                          ),
                                        ),
                                        OutlinedButton(
                                          onPressed: verified
                                              ? null
                                              : () => _scan(order),
                                          child: const Text('Scan'),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
