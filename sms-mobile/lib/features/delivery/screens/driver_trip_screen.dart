import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/hardware/barcode_scanner_view.dart';
import '../../../core/hardware/geo_location_service.dart';
import '../../../core/hardware/photo_proof_widget.dart';
import '../../../core/hardware/signature_pad_widget.dart';
import '../providers/delivery_provider.dart';

class DriverTripScreen extends ConsumerStatefulWidget {
  final String tripId;
  const DriverTripScreen({super.key, required this.tripId});

  @override
  ConsumerState<DriverTripScreen> createState() => _DriverTripScreenState();
}

class _DriverTripScreenState extends ConsumerState<DriverTripScreen> {
  int _totalCodCollected = 0;

  void _openBarcodeScanner(String expectedDo) {
    showDialog<String>(
      context: context,
      builder: (ctx) => BarcodeScannerModal(
        title: 'Scan Delivery Barcode',
        prompt: 'Scan Surat Jalan QR or Stock Unit Serial',
      ),
    ).then((scanned) {
      if (scanned != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Scanned barcode verified: $scanned'),
            backgroundColor: AppColors.secondary,
          ),
        );
      }
    });
  }

  void _markDelivered(
    String orderId,
    String currentCustomer,
    double codAmount,
    String doNumber,
  ) {
    final receiverController = TextEditingController(text: currentCustomer);
    final phoneController = TextEditingController(text: '0812-3344-5566');
    final codController = TextEditingController(
      text: codAmount.toInt().toString(),
    );
    String? digitalSignatureBase64;
    List<PhotoProofItem> proofPhotos = [];

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDlgState) {
            return AlertDialog(
              title: const Text('Confirm Delivery Handover'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Surat Jalan: $doNumber',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: receiverController,
                      decoration: const InputDecoration(
                        labelText: 'Recipient Full Name',
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Recipient Phone',
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: codController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'COD Cash Collected (Rp)',
                        prefixText: 'Rp ',
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Digital Signature Pad Trigger
                    OutlinedButton.icon(
                      onPressed: () {
                        showDialog<String>(
                          context: context,
                          builder: (_) => SignaturePadWidget(
                            signerName:
                                receiverController.text.trim().isNotEmpty
                                ? receiverController.text.trim()
                                : currentCustomer,
                            documentTitle: 'Surat Jalan $doNumber Handover',
                          ),
                        ).then((sig) {
                          if (sig != null) {
                            setDlgState(() => digitalSignatureBase64 = sig);
                          }
                        });
                      },
                      icon: Icon(
                        digitalSignatureBase64 != null
                            ? Icons.check_circle_rounded
                            : Icons.draw_rounded,
                        color: digitalSignatureBase64 != null
                            ? AppColors.secondary
                            : AppColors.primary,
                      ),
                      label: Text(
                        digitalSignatureBase64 != null
                            ? 'Signature Captured'
                            : 'Customer Digital Signature',
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Photo Proof of Handover
                    PhotoProofGridWidget(
                      requiredCategories: const [
                        'Goods Handover',
                        'Signed Paper SJ',
                      ],
                      onPhotosChanged: (photos) {
                        proofPhotos = photos;
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                  ),
                  onPressed: () async {
                    final cod = double.tryParse(codController.text) ?? 0.0;
                    Navigator.pop(ctx);

                    // Read hardware GPS coordinates
                    late final GeoCoordinates location;
                    try {
                      location = await GeoLocationService.getCurrentLocation(
                        simulateAtStore: false,
                      );
                    } catch (error) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(this.context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Delivery not confirmed; GPS unavailable: $error',
                          ),
                        ),
                      );
                      return;
                    }

                    final success = await ref
                        .read(deliveryProvider.notifier)
                        .completeDelivery(
                          orderId,
                          recipientName: receiverController.text.trim(),
                          recipientPhone: phoneController.text.trim(),
                          codCollected: cod,
                          notes:
                              'Handover verified via GPS [${location.latitude}, ${location.longitude}]. Signature captured: ${digitalSignatureBase64 != null}. Photos: ${proofPhotos.length}',
                        );

                    if (!context.mounted) return;
                    if (success) {
                      setState(() => _totalCodCollected += cod.toInt());
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          success
                              ? 'Delivery confirmed.'
                              : 'Delivery was not confirmed by server. Check connection and retry.',
                        ),
                        backgroundColor: success
                            ? AppColors.secondary
                            : AppColors.error,
                      ),
                    );
                  },
                  child: const Text('Confirm Handover'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _reportFailed(String orderId) {
    String reason = 'CUSTOMER_UNREACHABLE';
    final notesController = TextEditingController();
    List<PhotoProofItem> failurePhotos = [];

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDlgState) {
            return AlertDialog(
              title: const Text('Report Delivery Failure'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      initialValue: reason,
                      decoration: const InputDecoration(
                        labelText: 'Failure Reason',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'CUSTOMER_UNREACHABLE',
                          child: Text('Customer Unreachable / Not Home'),
                        ),
                        DropdownMenuItem(
                          value: 'WRONG_ADDRESS',
                          child: Text('Wrong / Incomplete Address'),
                        ),
                        DropdownMenuItem(
                          value: 'REFUSED_BY_CUSTOMER',
                          child: Text('Customer Refused Goods'),
                        ),
                        DropdownMenuItem(
                          value: 'TRANSIT_DAMAGE',
                          child: Text('Item Damaged in Transit'),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) setDlgState(() => reason = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Operational Notes',
                      ),
                    ),
                    const SizedBox(height: 12),
                    PhotoProofGridWidget(
                      requiredCategories: const ['Delivery Failure Proof'],
                      onPhotosChanged: (photos) => failurePhotos = photos,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.error,
                  ),
                  onPressed: () async {
                    Navigator.pop(ctx);
                    late final GeoCoordinates location;
                    try {
                      location = await GeoLocationService.getCurrentLocation(
                        simulateAtStore: false,
                      );
                    } catch (error) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(this.context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Failure not reported; GPS unavailable: $error',
                          ),
                        ),
                      );
                      return;
                    }
                    final notes =
                        '${notesController.text.trim()} '
                                'GPS: ${location.latitude}, ${location.longitude}. '
                                'Failure proof photos: ${failurePhotos.length}.'
                            .trim();
                    final success = await ref
                        .read(deliveryProvider.notifier)
                        .failDelivery(orderId, reason: reason, notes: notes, proofPhotoUrl: failurePhotos.isNotEmpty ? failurePhotos.first.id : null);
                    if (!context.mounted) return;
                    final error = ref.read(deliveryProvider).error;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          success
                              ? 'Failure report submitted. Dispatcher must reschedule delivery.'
                              : 'Report not saved: ${error ?? 'request failed'}',
                        ),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  },
                  child: const Text('Submit Failure Report'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final deliveryState = ref.watch(deliveryProvider);
    final orders = deliveryState.orders;

    final deliveredCount = orders.where((d) => d.status == 'DELIVERED').length;
    final totalOrders = orders.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.tripId.isEmpty
              ? 'Driver Trip Execution'
              : 'Trip: ${widget.tripId}',
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded),
            tooltip: 'Barcode Scanner',
            onPressed: () => _openBarcodeScanner('DO/JKT/10/2026/0042'),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(deliveryProvider.notifier).loadDriverTrips(),
          ),
        ],
      ),
      body: deliveryState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Trip Header Banner
                Container(
                  color: AppColors.primary,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                deliveryState.activeTrip?.vehiclePlate ??
                                    'Vehicle: B 9142 SAA',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'Route: Jakarta Selatan 3-Drop Delivery',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.secondary,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '$deliveredCount / $totalOrders Drops',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'COD Custody Cash Balance:',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              'Rp ${_totalCodCollected.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                              style: const TextStyle(
                                color: AppColors.accent,
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Delivery Stops List
                Expanded(
                  child: orders.isEmpty
                      ? const Center(
                          child: Text(
                            'No active delivery stops for this trip.',
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: orders.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final order = orders[index];
                            final isDelivered = order.status == 'DELIVERED';
                            final isFailed = order.status == 'FAILED';

                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'Stop #${index + 1}  •  ${order.deliveryOrderNumber}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.textSecondary,
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: isDelivered
                                                ? AppColors.secondary
                                                      .withValues(alpha: 0.15)
                                                : isFailed
                                                ? AppColors.error.withValues(
                                                    alpha: 0.15,
                                                  )
                                                : AppColors.accent.withValues(
                                                    alpha: 0.15,
                                                  ),
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                          child: Text(
                                            order.status,
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: isDelivered
                                                  ? AppColors.secondary
                                                  : isFailed
                                                  ? AppColors.error
                                                  : AppColors.accent,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      order.recipientName,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Phone: ${order.recipientPhone}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Address: ${order.deliveryAddress}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: AppColors.background,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            Icons.inventory_2_outlined,
                                            size: 16,
                                            color: AppColors.primary,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              '${order.itemName ?? 'Product Item'} (SN: ${order.serialNumber ?? 'SN-PENDING'})',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(
                                              Icons.qr_code_scanner_rounded,
                                              size: 18,
                                              color: AppColors.primary,
                                            ),
                                            tooltip: 'Verify Serial Barcode',
                                            onPressed: () =>
                                                _openBarcodeScanner(
                                                  order.serialNumber ??
                                                      'SHP-RF-9021',
                                                ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (order.codAmount > 0) ...[
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.payments_outlined,
                                            size: 16,
                                            color: AppColors.accent,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'COD Collection Required: Rp ${order.codAmount.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.accent,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                    if (!isDelivered && !isFailed) ...[
                                      const SizedBox(height: 12),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: OutlinedButton(
                                              onPressed: () =>
                                                  _reportFailed(order.id),
                                              style: OutlinedButton.styleFrom(
                                                foregroundColor:
                                                    AppColors.error,
                                                side: const BorderSide(
                                                  color: AppColors.error,
                                                ),
                                              ),
                                              child: const Text(
                                                'Failed / Refused',
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: ElevatedButton(
                                              onPressed: () => _markDelivered(
                                                order.id,
                                                order.recipientName,
                                                order.codAmount,
                                                order.deliveryOrderNumber,
                                              ),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor:
                                                    AppColors.secondary,
                                              ),
                                              child: const Text(
                                                'Handover Done',
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
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
