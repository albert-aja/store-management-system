import 'package:sms_mobile/core/localization/worker_message.dart';
import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import '../../../core/localization/worker_format.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/hardware/geo_location_service.dart';
import '../../../core/hardware/photo_proof_widget.dart';
import '../../../core/hardware/signature_pad_widget.dart';
import '../../../core/offline/offline_sync_queue.dart';
import 'package:go_router/go_router.dart';
import '../../customer_crm/providers/customer_crm_provider.dart';
import '../../../core/hardware/active_tracking_banner.dart';
import '../../../core/hardware/fleet_tracking_service.dart';
import '../providers/collection_provider.dart';

class CollectorVisitScreen extends ConsumerStatefulWidget {
  final String visitId;
  const CollectorVisitScreen({super.key, required this.visitId});

  @override
  ConsumerState<CollectorVisitScreen> createState() =>
      _CollectorVisitScreenState();
}

class _CollectorVisitScreenState extends ConsumerState<CollectorVisitScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref
          .read(fleetTrackingProvider.notifier)
          .startTracking(
            taskType: 'COLLECTION_TASK',
            taskCode: 'CT-${widget.visitId}',
            geofenceTargets: const [
              GeofenceTarget(
                id: 'col-target-01',
                title: 'Bpk. Hendra Gunawan',
                address: 'Jl. Tebet Barat Raya No. 45, Jakarta Selatan',
                latitude: -6.1825,
                longitude: 106.8355,
                radiusMeters: 300.0,
              ),
            ],
          );
    });
  }

  String _outcome = 'PAID_CASH';
  final _amountController = TextEditingController(text: '450000');
  DateTime _promiseDate = DateTime.now().add(const Duration(days: 7));
  final _visitNotesController = TextEditingController();
  bool _isSaving = false;
  String? _payerSignatureBase64;
  List<PhotoProofItem> _visitPhotos = [];

  @override
  void dispose() {
    _amountController.dispose();
    _visitNotesController.dispose();
    super.dispose();
  }

  Future<void> _recordVisit() async {
    setState(() => _isSaving = true);
    final amount =
        double.tryParse(_amountController.text.replaceAll('.', '')) ?? 0.0;

    // Read GPS coordinates for field anti-fraud audit
    late final GeoCoordinates location;
    try {
      location = await GeoLocationService.getCurrentLocation(
        simulateAtStore: false,
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n.message87(context.errorText(error))),
        ),
      );
      return;
    }

    await ref.read(fleetTrackingProvider.notifier).completeTracking();
    final success = await ref
        .read(collectionProvider.notifier)
        .recordCollectionVisit(
          customerId: 'cust-101',
          receivableId: 'rec-101',
          outcome: _outcome,
          paidAmount: amount,
          promiseDate: _outcome == 'PROMISED_TO_PAY' ? _promiseDate : null,
          notes:
              '${_visitNotesController.text} (GPS: ${location.latitude}, ${location.longitude}, Signature: ${_payerSignatureBase64 != null}, Photos: ${_visitPhotos.length})',
        );

    // Enqueue offline action for persistent guaranteed delivery
    ref
        .read(offlineSyncProvider.notifier)
        .enqueueAction(
          actionType: 'RECORD_COLLECTION',
          endpoint: '/api/finance/collections',
          payload: {
            'customerId': 'cust-101',
            'receivableId': 'rec-101',
            'outcome': _outcome,
            'paidAmount': amount,
            'latitude': location.latitude,
            'longitude': location.longitude,
            'hasSignature': _payerSignatureBase64 != null,
            'photoCount': _visitPhotos.length,
          },
        );

    // Sync to Customer 360 CRM Ledger
    if (_outcome == 'PROMISED_TO_PAY') {
      await ref
          .read(customer360Provider.notifier)
          .recordPromiseToPay(
            customerId: 'cust-101',
            promisedAmount: amount,
            promisedDate: _promiseDate,
            notes: _visitNotesController.text,
          );
    } else {
      await ref
          .read(customer360Provider.notifier)
          .recordInteraction(
            customerId: 'cust-101',
            channel: 'IN_PERSON',
            direction: 'OUTBOUND',
            subject: 'Kunjungan Penagihan Lapangan',
            outcome: _outcome == 'PAID_CASH' ? 'PAYMENT_COLLECTED' : 'REACHED',
            notes: _visitNotesController.text,
          );
    }

    setState(() => _isSaving = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message89(context.uiCode(_outcome))),
            backgroundColor: AppColors.secondary,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message90),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _handoverCash(double currentHeldCash) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.message91),
        content: Text(
          context.l10n.message92(context.number(currentHeldCash.toInt())),
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
              Navigator.pop(ctx);
              await ref
                  .read(collectionProvider.notifier)
                  .handoverCashToCashier(amount: currentHeldCash);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(context.l10n.message93),
                    backgroundColor: AppColors.secondary,
                  ),
                );
              }
            },
            child: Text(context.l10n.message94),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colState = ref.watch(collectionProvider);
    final heldCash = colState.totalHeldCash;

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.message95),
        actions: [
          const WorkerLanguageSwitcher(),
          IconButton(
            tooltip: context.l10n.message44,
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(collectionProvider.notifier).loadCollectionData(),
          ),
        ],
      ),
      body: colState.isLoading || _isSaving
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Task-Bounded GPS Tracking Status Banner
                  const ActiveTrackingBanner(),
                  const SizedBox(height: 12),

                  // Cash Custody Held Status
                  Card(
                    color: AppColors.primary,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                context.l10n.message96,
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                context.rupiah(heldCash.toInt()),
                                style: const TextStyle(
                                  color: AppColors.accent,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                          if (heldCash > 0)
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.secondary,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                              ),
                              onPressed: () => _handoverCash(heldCash),
                              child: Text(
                                context.l10n.message97,
                                style: TextStyle(fontSize: 12),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Customer & Debt Context
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                context.l10n.message98,
                                style: TextStyle(
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
                                  color: AppColors.error.withValues(
                                    alpha: 0.15,
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  context.l10n.message99,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.error,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Hendra Wijaya',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            context.l10n.message100,
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            context.l10n.message101,
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                context.l10n.message102,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                context.rupiah(450000),
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.error,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.badge_outlined, size: 18),
                    label: Text(context.l10n.message103),
                    onPressed: () => context.push('/customer-360/cust-101'),
                  ),
                  const SizedBox(height: 12),

                  // Visit Outcome Form
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            context.l10n.message104,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 14),
                          DropdownButtonFormField<String>(
                            initialValue: _outcome,
                            decoration: InputDecoration(
                              labelText: context.l10n.message105,
                            ),
                            items: [
                              DropdownMenuItem(
                                value: 'PAID_CASH',
                                child: Text(context.l10n.message106),
                              ),
                              DropdownMenuItem(
                                value: 'PAID_TRANSFER',
                                child: Text(context.l10n.message107),
                              ),
                              DropdownMenuItem(
                                value: 'PROMISED_TO_PAY',
                                child: Text(context.l10n.message108),
                              ),
                              DropdownMenuItem(
                                value: 'NOT_HOME',
                                child: Text(context.l10n.message109),
                              ),
                              DropdownMenuItem(
                                value: 'REFUSED',
                                child: Text(context.l10n.message110),
                              ),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _outcome = val);
                            },
                          ),
                          if (_outcome == 'PAID_CASH' ||
                              _outcome == 'PAID_TRANSFER') ...[
                            const SizedBox(height: 12),
                            TextField(
                              controller: _amountController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                labelText: context.l10n.message111,
                                prefixText: 'Rp ',
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Payer Digital Signature
                            OutlinedButton.icon(
                              onPressed: () {
                                showDialog<String>(
                                  context: context,
                                  builder: (_) => SignaturePadWidget(
                                    signerName: 'Hendra Wijaya',
                                    documentTitle: context.l10n.message112,
                                  ),
                                ).then((sig) {
                                  if (sig != null) {
                                    setState(() => _payerSignatureBase64 = sig);
                                  }
                                });
                              },
                              icon: Icon(
                                _payerSignatureBase64 != null
                                    ? Icons.check_circle_rounded
                                    : Icons.draw_rounded,
                                color: _payerSignatureBase64 != null
                                    ? AppColors.secondary
                                    : AppColors.primary,
                              ),
                              label: Text(
                                _payerSignatureBase64 != null
                                    ? context.l10n.message113
                                    : context.l10n.message114,
                              ),
                            ),
                          ],
                          if (_outcome == 'PROMISED_TO_PAY') ...[
                            const SizedBox(height: 12),
                            InkWell(
                              onTap: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate: _promiseDate,
                                  firstDate: DateTime.now(),
                                  lastDate: DateTime.now().add(
                                    const Duration(days: 30),
                                  ),
                                );
                                if (picked != null) {
                                  setState(() => _promiseDate = picked);
                                }
                              },
                              child: InputDecorator(
                                decoration: InputDecoration(
                                  labelText: context.l10n.message115,
                                ),
                                child: Text(
                                  context.date(
                                    _promiseDate,
                                    pattern: 'dd MMMM yyyy',
                                  ),
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 14),

                          // Field Visit Photo Evidence
                          PhotoProofGridWidget(
                            requiredCategories: const [
                              'Location Evidence',
                              'Receipt Voucher',
                            ],
                            onPhotosChanged: (photos) {
                              _visitPhotos = photos;
                            },
                          ),
                          const SizedBox(height: 14),

                          TextField(
                            controller: _visitNotesController,
                            maxLines: 3,
                            decoration: InputDecoration(
                              labelText: context.l10n.message118,
                              hintText: context.l10n.message119,
                            ),
                          ),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _recordVisit,
                              icon: const Icon(Icons.save_rounded),
                              label: Text(context.l10n.message120),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }
}
