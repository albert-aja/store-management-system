import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class DriverTripScreen extends StatefulWidget {
  final String tripId;
  const DriverTripScreen({super.key, required this.tripId});

  @override
  State<DriverTripScreen> createState() => _DriverTripScreenState();
}

class _DriverTripScreenState extends State<DriverTripScreen> {
  final List<Map<String, dynamic>> _deliveryOrders = [
    {
      'doNumber': 'DO/JKT/10/2026/0041',
      'customer': 'Dewi Lestari',
      'phone': '0813-1122-3344',
      'address': 'Jl. Kenanga No. 12, Tebet Timur',
      'item': 'Sharp 2-Door Refrigerator 210L (SN: SHP-RF-9021)',
      'codAmount': 0,
      'status': 'DELIVERED',
    },
    {
      'doNumber': 'DO/JKT/10/2026/0042',
      'customer': 'Agus Setiawan',
      'phone': '0812-4455-6677',
      'address': 'Jl. Mampang Prapatan VIII No. 18',
      'item': 'LG Front Load Washing Machine 8kg (SN: LG-WM-1148)',
      'codAmount': 1500000, // COD DP
      'status': 'PENDING',
    },
    {
      'doNumber': 'DO/JKT/10/2026/0043',
      'customer': 'Ratna Sari',
      'phone': '0815-9988-7766',
      'address': 'Jl. Pejaten Barat No. 88, Pasar Minggu',
      'item': 'Samsung 50" UHD 4K TV (SN: SAM-TV-3310)',
      'codAmount': 0,
      'status': 'PENDING',
    },
  ];

  int _totalCodCollected = 0;

  void _markDelivered(int index) {
    showDialog(
      context: context,
      builder: (ctx) {
        final receiverController = TextEditingController(text: _deliveryOrders[index]['customer'] as String);
        return AlertDialog(
          title: const Text('Confirm Delivery Handover'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Surat Jalan: ${_deliveryOrders[index]['doNumber']}'),
              const SizedBox(height: 12),
              TextField(
                controller: receiverController,
                decoration: const InputDecoration(labelText: 'Recipient Full Name'),
              ),
              const SizedBox(height: 10),
              if ((_deliveryOrders[index]['codAmount'] as int) > 0) ...[
                Text(
                  'COD Cash to collect: Rp ${(_deliveryOrders[index]['codAmount'] as int).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.secondary),
              onPressed: () {
                setState(() {
                  _deliveryOrders[index]['status'] = 'DELIVERED';
                  final cod = _deliveryOrders[index]['codAmount'] as int;
                  if (cod > 0) _totalCodCollected += cod;
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Delivery marked SUCCESSFUL! Stock unit transferred to customer.'),
                    backgroundColor: AppColors.secondary,
                  ),
                );
              },
              child: const Text('Confirm Handover'),
            ),
          ],
        );
      },
    );
  }

  void _markFailed(int index) {
    showDialog(
      context: context,
      builder: (ctx) {
        String failureReason = 'CUSTOMER_UNAVAILABLE';
        return StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            title: const Text('Report Delivery Failure'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: failureReason,
                  decoration: const InputDecoration(labelText: 'Failure Cause'),
                  items: const [
                    DropdownMenuItem(value: 'CUSTOMER_UNAVAILABLE', child: Text('Customer Not Home')),
                    DropdownMenuItem(value: 'ADDRESS_NOT_FOUND', child: Text('Address Unreachable')),
                    DropdownMenuItem(value: 'CUSTOMER_REJECTED', child: Text('Customer Refused Goods')),
                  ],
                  onChanged: (v) {
                    if (v != null) setDialogState(() => failureReason = v);
                  },
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                onPressed: () {
                  setState(() {
                    _deliveryOrders[index]['status'] = 'FAILED';
                  });
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Delivery failed recorded. Rescheduling queued.'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                },
                child: const Text('Report Failure'),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery Trip #TRIP-082'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Vehicle & Team Information Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.local_shipping_rounded, color: AppColors.primary, size: 28),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Vehicle: B 9482 SXZ (Van)',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Driver: Joko Pratama • Helper: Ahmad Doni',
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          Text(
                            'Pre-trip vehicle inspection: ✓ PASSED',
                            style: TextStyle(fontSize: 11, color: AppColors.secondary, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // COD Cash in Custody bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.account_balance_wallet_outlined, color: Colors.amber, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'COD Cash in Custody:',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  Text(
                    'Rp ${_totalCodCollected.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'Trip Destinations (Surat Jalan)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),

            ..._deliveryOrders.asMap().entries.map((entry) {
              final index = entry.key;
              final doOrder = entry.value;
              final isDelivered = doOrder['status'] == 'DELIVERED';
              final isFailed = doOrder['status'] == 'FAILED';

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            doOrder['doNumber'] as String,
                            style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
                          ),
                          Chip(
                            label: Text(doOrder['status'] as String),
                            labelStyle: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: isDelivered
                                  ? AppColors.secondary
                                  : isFailed
                                      ? AppColors.error
                                      : AppColors.accent,
                            ),
                            backgroundColor: (isDelivered
                                    ? AppColors.secondary
                                    : isFailed
                                        ? AppColors.error
                                        : AppColors.accent)
                                .withValues(alpha: 0.12),
                            side: BorderSide.none,
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        doOrder['customer'] as String,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                      ),
                      Text(
                        'Tel: ${doOrder['phone']}',
                        style: const TextStyle(fontSize: 12, color: AppColors.primaryLight),
                      ),
                      Text(
                        doOrder['address'] as String,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          doOrder['item'] as String,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      ),
                      if (!isDelivered && !isFailed) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                                onPressed: () => _markFailed(index),
                                child: const Text('Report Failure'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.secondary),
                                onPressed: () => _markDelivered(index),
                                child: const Text('Mark Delivered'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
