import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/hardware/active_tracking_banner.dart';
import '../../../core/hardware/barcode_scanner_view.dart';
import '../../../core/hardware/geo_location_service.dart';
import '../../../core/hardware/photo_proof_widget.dart';
import '../../../core/hardware/signature_pad_widget.dart';
import '../providers/delivery_provider.dart';
import '../widgets/navigation_handover_button.dart';
import '../../../core/localization/worker_message.dart';
import '../../../core/localization/worker_format.dart';

class DriverTripScreen extends ConsumerStatefulWidget {
  final String tripId;
  final String? returnedStopId;
  const DriverTripScreen({
    super.key,
    required this.tripId,
    this.returnedStopId,
  });

  @override
  ConsumerState<DriverTripScreen> createState() => _DriverTripScreenState();
}

class _DriverTripScreenState extends ConsumerState<DriverTripScreen> {
  int _totalCodCollected = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref
          .read(deliveryProvider.notifier)
          .loadDriverTrips(tripId: widget.tripId);
      if (widget.returnedStopId != null) _navigationReturned();
    });
  }

  @override
  void didUpdateWidget(DriverTripScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.tripId != widget.tripId) {
      _totalCodCollected = 0;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          ref
              .read(deliveryProvider.notifier)
              .loadDriverTrips(tripId: widget.tripId);
        }
      });
    }
    if (widget.returnedStopId != null &&
        oldWidget.returnedStopId != widget.returnedStopId) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _navigationReturned();
      });
    }
  }

  void _navigationReturned() {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(context.l10n.message172)));
  }

  void _openBarcodeScanner(String expectedDo) {
    showDialog<String>(
      context: context,
      builder: (ctx) => BarcodeScannerModal(
        title: context.l10n.message173,
        prompt: context.l10n.message174,
      ),
    ).then((scanned) {
      if (scanned != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message175((scanned).toString())),
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
              title: Text(context.l10n.message176),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.l10n.message177((doNumber).toString()),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: receiverController,
                      decoration: InputDecoration(
                        labelText: context.l10n.message178,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: phoneController,
                      decoration: InputDecoration(
                        labelText: context.l10n.message179,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: codController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: context.l10n.message180,
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
                            documentTitle: context.l10n.message181(
                              (doNumber).toString(),
                            ),
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
                            ? context.l10n.message182
                            : context.l10n.message183,
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
                  child: Text(context.l10n.message5),
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
                          content: WorkerErrorText(
                            WorkerMessage(
                              (l10n) =>
                                  l10n.message186(localizedError(l10n, error)),
                            ),
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

                    if (!mounted) return;
                    if (success) {
                      setState(() => _totalCodCollected += cod.toInt());
                    }
                    ScaffoldMessenger.of(this.context).showSnackBar(
                      SnackBar(
                        content: WorkerErrorText(
                          WorkerMessage(
                            (l10n) =>
                                success ? l10n.message188 : l10n.message189,
                          ),
                        ),
                        backgroundColor: success
                            ? AppColors.secondary
                            : AppColors.error,
                      ),
                    );
                  },
                  child: Text(context.l10n.message94),
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
              title: Text(context.l10n.message190),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<String>(
                      initialValue: reason,
                      decoration: InputDecoration(
                        labelText: context.l10n.message191,
                      ),
                      items: [
                        DropdownMenuItem(
                          value: 'CUSTOMER_UNREACHABLE',
                          child: Text(context.l10n.message192),
                        ),
                        DropdownMenuItem(
                          value: 'WRONG_ADDRESS',
                          child: Text(context.l10n.message193),
                        ),
                        DropdownMenuItem(
                          value: 'REFUSED_BY_CUSTOMER',
                          child: Text(context.l10n.message194),
                        ),
                        DropdownMenuItem(
                          value: 'TRANSIT_DAMAGE',
                          child: Text(context.l10n.message195),
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
                      decoration: InputDecoration(
                        labelText: context.l10n.message196,
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
                  child: Text(context.l10n.message5),
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
                          content: WorkerErrorText(
                            WorkerMessage(
                              (l10n) =>
                                  l10n.message198(localizedError(l10n, error)),
                            ),
                          ),
                        ),
                      );
                      return;
                    }
                    final notes =
                        '${notesController.text.trim()} GPS: ${location.latitude}, ${location.longitude}. Failure proof photos: ${failurePhotos.length}.'
                            .trim();
                    final success = await ref
                        .read(deliveryProvider.notifier)
                        .failDelivery(
                          orderId,
                          reason: reason,
                          notes: notes,
                          proofPhotoUrl: failurePhotos.isNotEmpty
                              ? failurePhotos.first.id
                              : null,
                        );
                    if (!mounted) return;
                    final error = ref.read(deliveryProvider).error;
                    ScaffoldMessenger.of(this.context).showSnackBar(
                      SnackBar(
                        content: WorkerErrorText(
                          WorkerMessage(
                            (l10n) => success
                                ? l10n.message200
                                : l10n.message201(
                                    error == null
                                        ? l10n.requestFailed
                                        : localizedError(l10n, error),
                                  ),
                          ),
                        ),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  },
                  child: Text(context.l10n.message202),
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
    final orders = deliveryState.orders
        .where(
          (order) => widget.tripId.isEmpty || order.tripId == widget.tripId,
        )
        .toList();

    final deliveredCount = orders.where((d) => d.status == 'DELIVERED').length;
    final totalOrders = orders.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.tripId.isEmpty
              ? context.l10n.message203
              : context.l10n.message204((widget.tripId).toString()),
        ),
        actions: [
          const WorkerLanguageSwitcher(),
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded),
            tooltip: context.l10n.message205,
            onPressed: () => _openBarcodeScanner('DO/JKT/10/2026/0042'),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: context.l10n.message44,
            onPressed: () => ref
                .read(deliveryProvider.notifier)
                .loadDriverTrips(tripId: widget.tripId),
          ),
        ],
      ),
      body: deliveryState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                const ActiveTrackingBanner(),
                if (deliveryState.error != null)
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(
                      context.errorText(deliveryState.error),
                      style: const TextStyle(color: AppColors.error),
                    ),
                  ),
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
                                    context.l10n.message206,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                deliveryState.activeTrip?.tripNumber ??
                                    context.l10n.message207,
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
                              context.l10n.message208(
                                (deliveredCount).toString(),
                                (totalOrders).toString(),
                              ),
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
                            Text(
                              context.l10n.message209,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              context.rupiah(_totalCodCollected),
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
                      ? Center(child: Text(context.l10n.message210))
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
                                          context.l10n.message211(
                                            (index + 1).toString(),
                                            (order.deliveryOrderNumber)
                                                .toString(),
                                          ),
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
                                            context.uiCode(order.status),
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
                                      order.recipientName.isEmpty
                                          ? context.l10n.message403
                                          : order.recipientName,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      context.l10n.message212(
                                        (order.recipientPhone).toString(),
                                      ),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      context.l10n.message213(
                                        (order.deliveryAddress).toString(),
                                      ),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    if (order.deliveryWindow != null)
                                      Text(
                                        context.l10n.deliveryWindowValue(
                                          context.deliveryWindow(
                                            order.deliveryWindow!,
                                          ),
                                        ),
                                        style: const TextStyle(fontSize: 12),
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
                                              context.l10n.message215(
                                                (order.itemName ??
                                                        context
                                                            .l10n
                                                            .productItem)
                                                    .toString(),
                                                (order.serialNumber ??
                                                        context
                                                            .l10n
                                                            .notAssigned)
                                                    .toString(),
                                              ),
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
                                            tooltip: context.l10n.message216,
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
                                            context.l10n.message217(
                                              context.number(
                                                order.codAmount.toInt(),
                                              ),
                                            ),
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
                                      if (order.status == 'PENDING' ||
                                          order.status == 'IN_TRANSIT')
                                        NavigationHandoverButton(
                                          key: ValueKey(order.id),
                                          tripId: order.tripId ?? widget.tripId,
                                          order: order,
                                          onReturned: _navigationReturned,
                                        ),
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
                                              child: Text(
                                                context.l10n.message218,
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
                                              child: Text(
                                                context.l10n.message219,
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
