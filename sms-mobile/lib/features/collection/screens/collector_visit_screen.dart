import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';

class CollectorVisitScreen extends StatefulWidget {
  final String visitId;
  const CollectorVisitScreen({super.key, required this.visitId});

  @override
  State<CollectorVisitScreen> createState() => _CollectorVisitScreenState();
}

class _CollectorVisitScreenState extends State<CollectorVisitScreen> {
  String _outcome = 'PAID_CASH';
  final _amountController = TextEditingController(text: '450000');
  DateTime _promiseDate = DateTime.now().add(const Duration(days: 7));
  final _visitNotesController = TextEditingController();

  int _heldCashBalance = 450000;

  @override
  void dispose() {
    _amountController.dispose();
    _visitNotesController.dispose();
    super.dispose();
  }

  void _recordVisit() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Field collection outcome recorded: $_outcome'),
        backgroundColor: AppColors.secondary,
      ),
    );
  }

  void _handoverCash() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hand Over Cash to Cashier'),
        content: Text(
          'Confirm handover of Rp ${_heldCashBalance.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')} to store cashier? Status will change to HANDED_OVER awaiting cashier verification.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.secondary),
            onPressed: () {
              setState(() {
                _heldCashBalance = 0;
              });
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Cash custody handed over to cashier successfully!'),
                  backgroundColor: AppColors.secondary,
                ),
              );
            },
            child: const Text('Confirm Handover'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Field Collection Visit'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Cash in Custody Alert Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.emerald.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.emerald.withValues(alpha: 0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Held by Collector (Custody):',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      Text(
                        'Rp ${_heldCashBalance.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.secondary),
                      ),
                    ],
                  ),
                  if (_heldCashBalance > 0)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      onPressed: _handoverCash,
                      child: const Text('Handover to Cashier', style: TextStyle(fontSize: 12)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Customer Debt Context Card
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
                          'REC/JKT/10/2026/0088',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primary),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.error.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            '38 DAYS PAST DUE',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.error),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    const Text('Hendra Wijaya', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    const Text('Phone: 0811-2233-4455', style: TextStyle(color: AppColors.primaryLight)),
                    const Text('Address: Jl. Cempaka Putih Tengah No. 15, Jakarta Pusat'),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Installment #4 Due:', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                            const Text('Rp 450,000', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.error)),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Remaining Balance:', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                            const Text('Rp 3,600,000 (8 mos left)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Outcome Form Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Record Visit Outcome', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),

                    DropdownButtonFormField<String>(
                      initialValue: _outcome,
                      decoration: const InputDecoration(labelText: 'Visit Result'),
                      items: const [
                        DropdownMenuItem(value: 'PAID_CASH', child: Text('Paid in Cash')),
                        DropdownMenuItem(value: 'PAID_TRANSFER', child: Text('Paid via Bank Transfer')),
                        DropdownMenuItem(value: 'PROMISED_TO_PAY', child: Text('Promised to Pay (PTP)')),
                        DropdownMenuItem(value: 'NOT_HOME', child: Text('Customer Not at Residence')),
                        DropdownMenuItem(value: 'REFUSED', child: Text('Refused Payment (Dispute)')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _outcome = val);
                      },
                    ),
                    const SizedBox(height: 14),

                    if (_outcome.startsWith('PAID')) ...[
                      TextField(
                        controller: _amountController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Amount Collected (Rp)',
                          prefixText: 'Rp ',
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    if (_outcome == 'PROMISED_TO_PAY') ...[
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
                          decoration: const InputDecoration(labelText: 'Customer Promised Date'),
                          child: Text(DateFormat('EEEE, dd MMMM yyyy').format(_promiseDate)),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        '* Promised date does not alter legal contract due date.',
                        style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 14),
                    ],

                    TextField(
                      controller: _visitNotesController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Operational Visit Notes',
                        hintText: 'Customer statement, work status, payment reference',
                      ),
                    ),
                    const SizedBox(height: 20),

                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: _recordVisit,
                      child: const Text('Save Visit Outcome', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
