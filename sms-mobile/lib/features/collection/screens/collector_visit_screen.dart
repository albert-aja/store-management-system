import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/hardware/geo_location_service.dart';
import '../../../core/hardware/photo_proof_widget.dart';
import '../../../core/hardware/signature_pad_widget.dart';
import '../../../core/offline/offline_sync_queue.dart';
import '../providers/collection_provider.dart';

class CollectorVisitScreen extends ConsumerStatefulWidget {
  final String visitId;
  const CollectorVisitScreen({super.key, required this.visitId});

  @override
  ConsumerState<CollectorVisitScreen> createState() => _CollectorVisitScreenState();
}

class _CollectorVisitScreenState extends ConsumerState<CollectorVisitScreen> {
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
    final amount = double.tryParse(_amountController.text.replaceAll('.', '')) ?? 0.0;

    // Read GPS coordinates for field anti-fraud audit
    final location = await GeoLocationService.getCurrentLocation(simulateAtStore: false);

    final success = await ref.read(collectionProvider.notifier).recordCollectionVisit(
          customerId: 'cust-101',
          receivableId: 'rec-101',
          outcome: _outcome,
          paidAmount: amount,
          promiseDate: _outcome == 'PROMISED_TO_PAY' ? _promiseDate : null,
          notes: '${_visitNotesController.text} (GPS: ${location.latitude}, ${location.longitude}, Signature: ${_payerSignatureBase64 != null}, Photos: ${_visitPhotos.length})',
        );

    // Enqueue offline action for persistent guaranteed delivery
    ref.read(offlineSyncProvider.notifier).enqueueAction(
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

    setState(() => _isSaving = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Field collection outcome recorded: $_outcome with GPS verification'),
            backgroundColor: AppColors.secondary,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to record collection attempt'),
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
        title: const Text('Hand Over Cash to Cashier'),
        content: Text(
          'Confirm handover of Rp ${currentHeldCash.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')} to store cashier? Status will change to HANDED_OVER awaiting cashier verification.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.secondary),
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(collectionProvider.notifier).handoverCashToCashier(amount: currentHeldCash);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Cash custody handed over to cashier successfully!'),
                    backgroundColor: AppColors.secondary,
                  ),
                );
              }
            },
            child: const Text('Confirm Handover'),
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
        title: const Text('Field Collection Visit'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(collectionProvider.notifier).loadCollectionData(),
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
                              const Text(
                                'Cash Custody in Hand:',
                                style: TextStyle(color: Colors.white70, fontSize: 12),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Rp ${heldCash.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
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
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              ),
                              onPressed: () => _handoverCash(heldCash),
                              child: const Text('Hand Over Cash', style: TextStyle(fontSize: 12)),
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
                              const Text(
                                'Account: REC/JKT/10/2026/0088',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.error.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  '14 DAYS OVERDUE',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.error),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Hendra Wijaya',
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 4),
                          const Text('Phone: 0811-2233-4455  •  Installment #3 of 12', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          const SizedBox(height: 2),
                          const Text('Address: Jl. Pancoran Barat III No. 22, RT 04/RW 02', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          const Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: const [
                              Text('Overdue Installment Amount:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                              Text('Rp 450.000', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.error)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Visit Outcome Form
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Record Visit Outcome', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 14),
                          DropdownButtonFormField<String>(
                            initialValue: _outcome,
                            decoration: const InputDecoration(labelText: 'Outcome Classification'),
                            items: const [
                              DropdownMenuItem(value: 'PAID_CASH', child: Text('Paid in Full (Cash Handover)')),
                              DropdownMenuItem(value: 'PAID_TRANSFER', child: Text('Paid via Bank Transfer')),
                              DropdownMenuItem(value: 'PROMISED_TO_PAY', child: Text('Promised to Pay (PTP Date)')),
                              DropdownMenuItem(value: 'NOT_HOME', child: Text('Customer Not at Home')),
                              DropdownMenuItem(value: 'REFUSED', child: Text('Refused Payment / Dispute')),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _outcome = val);
                            },
                          ),
                          if (_outcome == 'PAID_CASH' || _outcome == 'PAID_TRANSFER') ...[
                            const SizedBox(height: 12),
                            TextField(
                              controller: _amountController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Collected Amount (Rp)',
                                prefixText: 'Rp ',
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Payer Digital Signature
                            OutlinedButton.icon(
                              onPressed: () {
                                showDialog<String>(
                                  context: context,
                                  builder: (_) => const SignaturePadWidget(
                                    signerName: 'Hendra Wijaya',
                                    documentTitle: 'Installment Payment Receipt',
                                  ),
                                ).then((sig) {
                                  if (sig != null) {
                                    setState(() => _payerSignatureBase64 = sig);
                                  }
                                });
                              },
                              icon: Icon(
                                _payerSignatureBase64 != null ? Icons.check_circle_rounded : Icons.draw_rounded,
                                color: _payerSignatureBase64 != null ? AppColors.secondary : AppColors.primary,
                              ),
                              label: Text(_payerSignatureBase64 != null ? 'Payer Signature Captured' : 'Customer Payment Signature'),
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
                                  lastDate: DateTime.now().add(const Duration(days: 30)),
                                );
                                if (picked != null) setState(() => _promiseDate = picked);
                              },
                              child: InputDecorator(
                                decoration: const InputDecoration(labelText: 'Promised Payment Date'),
                                child: Text(DateFormat('dd MMMM yyyy').format(_promiseDate)),
                              ),
                            ),
                          ],
                          const SizedBox(height: 14),

                          // Field Visit Photo Evidence
                          PhotoProofGridWidget(
                            requiredCategories: const ['Location Evidence', 'Receipt Voucher'],
                            onPhotosChanged: (photos) {
                              _visitPhotos = photos;
                            },
                          ),
                          const SizedBox(height: 14),

                          TextField(
                            controller: _visitNotesController,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'Collector Notes & Field Evidence',
                              hintText: 'Describe conversation outcome, obstacles, customer statement...',
                            ),
                          ),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _recordVisit,
                              icon: const Icon(Icons.save_rounded),
                              label: const Text('Save Field Visit Record'),
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
