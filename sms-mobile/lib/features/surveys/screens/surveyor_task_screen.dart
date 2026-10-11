import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';

class SurveyorTaskScreen extends StatefulWidget {
  final String surveyId;
  const SurveyorTaskScreen({super.key, required this.surveyId});

  @override
  State<SurveyorTaskScreen> createState() => _SurveyorTaskScreenState();
}

class _SurveyorTaskScreenState extends State<SurveyorTaskScreen> {
  String _houseStatus = 'OWNED';
  final _incomeController = TextEditingController(text: '7500000');
  final _assessmentNotes = TextEditingController();

  bool _ktpVerified = true;
  bool _kkVerified = true;
  bool _utilityBillVerified = true;
  bool _incomeProofVerified = true;

  @override
  void dispose() {
    _incomeController.dispose();
    _assessmentNotes.dispose();
    super.dispose();
  }

  void _submitDecision(bool approved) {
    final decisionStr = approved ? 'APPROVED' : 'REJECTED';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Confirm $decisionStr Survey?'),
        content: Text(
          approved
              ? 'This will approve customer credit eligibility and advance the sales order to confirmation.'
              : 'This will reject credit eligibility and set the sales order to terminal SURVEY_REJECTED.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: approved ? AppColors.secondary : AppColors.error,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Credit survey decision recorded: $decisionStr'),
                  backgroundColor: approved ? AppColors.secondary : AppColors.error,
                ),
              );
              context.pop();
            },
            child: Text(approved ? 'Confirm Approval' : 'Confirm Rejection'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Credit Survey Assessment'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Order and Customer Snapshot Card
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
                          'SO/JKT/10/2026/0014',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'CREDIT APPL',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppColors.accent,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    const Text(
                      'Customer Details',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    const Text('Bambang Pamungkas (NIK: 3174092801820001)'),
                    const Text('Phone: 0812-9876-5432'),
                    const Text('Address: Jl. Melati No. 42, RT 03/05, Kebayoran Baru'),
                    const SizedBox(height: 10),
                    const Text(
                      'Purchase Details',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    const Text('Items: Polytron 43" Smart TV (1 unit)'),
                    const Text('Financed Amount: Rp 4,200,000 (12 Months)'),
                    const Text('Estimated Installment: Rp 350,000 / month'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Structured Checklist Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Field Verification Checklist',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 12),

                    // House ownership
                    DropdownButtonFormField<String>(
                      initialValue: _houseStatus,
                      decoration: const InputDecoration(labelText: 'Residence Ownership'),
                      items: const [
                        DropdownMenuItem(value: 'OWNED', child: Text('Self-Owned (Milik Sendiri)')),
                        DropdownMenuItem(value: 'RENTED', child: Text('Rented / Contract (Kontrakan)')),
                        DropdownMenuItem(value: 'FAMILY', child: Text('Family House (Rumah Orang Tua)')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _houseStatus = val);
                      },
                    ),
                    const SizedBox(height: 14),

                    // Monthly Income
                    TextField(
                      controller: _incomeController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Verified Monthly Income (Rp)',
                        prefixText: 'Rp ',
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Document Verification Evidence',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Original KTP Match & Inspected', style: TextStyle(fontSize: 13)),
                      value: _ktpVerified,
                      onChanged: (v) => setState(() => _ktpVerified = v ?? false),
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Family Card (Kartu Keluarga) Inspected', style: TextStyle(fontSize: 13)),
                      value: _kkVerified,
                      onChanged: (v) => setState(() => _kkVerified = v ?? false),
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Electricity / Utility Bill Address Match', style: TextStyle(fontSize: 13)),
                      value: _utilityBillVerified,
                      onChanged: (v) => setState(() => _utilityBillVerified = v ?? false),
                    ),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Income Slip / Bank Account Active', style: TextStyle(fontSize: 13)),
                      value: _incomeProofVerified,
                      onChanged: (v) => setState(() => _incomeProofVerified = v ?? false),
                    ),
                    const SizedBox(height: 12),

                    TextField(
                      controller: _assessmentNotes,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Surveyor Field Assessment Notes',
                        hintText: 'Describe house condition, neighbor references, and repayment risk',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Decisive Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    icon: const Icon(Icons.cancel_outlined),
                    label: const Text('Reject Credit', style: TextStyle(fontWeight: FontWeight.w700)),
                    onPressed: () => _submitDecision(false),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.secondary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Approve Credit', style: TextStyle(fontWeight: FontWeight.w700)),
                    onPressed: () => _submitDecision(true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
