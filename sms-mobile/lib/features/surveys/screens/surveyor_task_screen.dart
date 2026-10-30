import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/hardware/geo_location_service.dart';
import '../../../core/hardware/photo_proof_widget.dart';
import '../providers/survey_provider.dart';

class SurveyorTaskScreen extends ConsumerStatefulWidget {
  final String surveyId;
  const SurveyorTaskScreen({super.key, required this.surveyId});

  @override
  ConsumerState<SurveyorTaskScreen> createState() => _SurveyorTaskScreenState();
}

class _SurveyorTaskScreenState extends ConsumerState<SurveyorTaskScreen> {
  String _houseStatus = 'OWNED';
  final _incomeController = TextEditingController(text: '7500000');
  final _expensesController = TextEditingController(text: '3500000');
  final _obligationsController = TextEditingController(text: 'None');
  final _assessmentNotes = TextEditingController(
    text: 'Eligible for 12 months installment credit.',
  );
  final _alleyWidthController = TextEditingController();
  final _stairClearanceController = TextEditingController();
  final _gateAccessController = TextEditingController();
  GeoCoordinates? _customerLocation;

  bool _ktpVerified = true;
  bool _kkVerified = true;
  bool _utilityBillVerified = true;
  bool _incomeProofVerified = true;
  bool _isSubmitting = false;

  List<PhotoProofItem> _surveyPhotos = [];

  @override
  void initState() {
    super.initState();
    _loadSurveyData();
  }

  Future<void> _loadSurveyData() async {
    final survey = await ref
        .read(surveyListProvider.notifier)
        .getSurvey(widget.surveyId);
    if (survey != null && mounted) {
      if (survey.monthlyIncome != null) {
        _incomeController.text = survey.monthlyIncome!.toInt().toString();
      }
      if (survey.monthlyExpenses != null) {
        _expensesController.text = survey.monthlyExpenses!.toInt().toString();
      }
      if (survey.existingObligations != null) {
        _obligationsController.text = survey.existingObligations!;
      }
      if (survey.abilityToPayAssessment != null) {
        _assessmentNotes.text = survey.abilityToPayAssessment!;
      }
    }
  }

  @override
  void dispose() {
    _incomeController.dispose();
    _expensesController.dispose();
    _obligationsController.dispose();
    _assessmentNotes.dispose();
    _alleyWidthController.dispose();
    _stairClearanceController.dispose();
    _gateAccessController.dispose();
    super.dispose();
  }

  Future<void> _captureCustomerLocation() async {
    try {
      final location = await GeoLocationService.getCurrentLocation(
        simulateAtStore: false,
      );
      if (mounted) setState(() => _customerLocation = location);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not capture GPS location: $error')),
        );
      }
    }
  }

  Future<void> _submitDecision(bool approved) async {
    final decisionStr = approved ? 'APPROVED' : 'REJECTED';
    final confirm = await showDialog<bool>(
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
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: approved ? AppColors.secondary : AppColors.error,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(approved ? 'Confirm Approval' : 'Confirm Rejection'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSubmitting = true);

    // Read GPS coordinates for field audit
    late final GeoCoordinates location;
    try {
      location = await GeoLocationService.getCurrentLocation(
        simulateAtStore: false,
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Survey decision not submitted; GPS unavailable: $error',
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final income =
        double.tryParse(_incomeController.text.replaceAll('.', '')) ?? 0.0;
    final expenses =
        double.tryParse(_expensesController.text.replaceAll('.', '')) ?? 0.0;

    // 1. Submit updated assessment fields
    final assessmentSaved = await ref
        .read(surveyListProvider.notifier)
        .updateAssessment(
          widget.surveyId,
          monthlyIncome: income,
          monthlyExpenses: expenses,
          existingObligations: _obligationsController.text,
          residenceNotes:
              'House status: $_houseStatus. '
              'Destination GPS: [${_customerLocation?.latitude ?? location.latitude}, '
              '${_customerLocation?.longitude ?? location.longitude}]. '
              'Alley width: ${_alleyWidthController.text.trim()} m. '
              'Stair clearance: ${_stairClearanceController.text.trim()} m. '
              'Gate access: ${_gateAccessController.text.trim()}. '
              'KTP: $_ktpVerified, KK: $_kkVerified, Utility: $_utilityBillVerified. '
              'Photos: ${_surveyPhotos.length}.',
          employmentNotes: 'Income proof verified: $_incomeProofVerified',
          referencesNotes: 'Field interview verified on-site by surveyor',
          abilityToPayAssessment: _assessmentNotes.text,
          destinationLatitude: _customerLocation?.latitude ?? location.latitude,
          destinationLongitude: _customerLocation?.longitude ?? location.longitude,
          alleyWidthMeters: double.tryParse(_alleyWidthController.text.trim()),
          stairClearanceMeters: double.tryParse(_stairClearanceController.text.trim()),
          gateAccessNotes: _gateAccessController.text.trim(),
        );
    if (!assessmentSaved) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Survey profile was not saved. Check connection and retry.',
            ),
            backgroundColor: AppColors.error,
          ),
        );
      }
      return;
    }

    // 2. Submit definitive decision
    final success = await ref
        .read(surveyListProvider.notifier)
        .decideSurvey(
          widget.surveyId,
          approve: approved,
          notes:
              '${_assessmentNotes.text} (GPS: ${location.latitude}, ${location.longitude})',
        );

    setState(() => _isSubmitting = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Credit survey decision recorded: $decisionStr with GPS & ${_surveyPhotos.length} photos',
            ),
            backgroundColor: approved ? AppColors.secondary : AppColors.error,
          ),
        );
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to submit survey decision'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Credit Survey Assessment')),
      body: _isSubmitting
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Customer Header Card
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
                                'Survey ID: ${widget.surveyId}',
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
                                  color: AppColors.accent.withValues(
                                    alpha: 0.15,
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'ASSIGNED',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.accent,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Bambang Pamungkas',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'NIK: 3171021405880003  •  Phone: 0812-8899-7711',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Address: Jl. Tebet Barat Dalam VII No. 4, Jakarta Selatan',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Delivery Location Profile',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _customerLocation == null
                                ? 'Destination GPS not captured'
                                : 'GPS: ${_customerLocation!.latitude.toStringAsFixed(6)}, '
                                      '${_customerLocation!.longitude.toStringAsFixed(6)} '
                                      '(±${_customerLocation!.accuracyMeters.toStringAsFixed(1)} m)',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton.icon(
                              onPressed: _captureCustomerLocation,
                              icon: const Icon(Icons.location_searching),
                              label: const Text('Capture destination GPS'),
                            ),
                          ),
                          TextField(
                            controller: _alleyWidthController,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            decoration: const InputDecoration(
                              labelText: 'Alley width (meters)',
                              suffixText: 'm',
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _stairClearanceController,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            decoration: const InputDecoration(
                              labelText: 'Stair / doorway clearance (meters)',
                              suffixText: 'm',
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _gateAccessController,
                            maxLines: 2,
                            decoration: const InputDecoration(
                              labelText: 'Gate and delivery access notes',
                              hintText:
                                  'Gate width, access hours, stairs, parking constraints',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Residence & Financial Verification
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Residence & Financial Verification',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 14),
                          DropdownButtonFormField<String>(
                            initialValue: _houseStatus,
                            decoration: const InputDecoration(
                              labelText: 'Home Ownership Status',
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: 'OWNED',
                                child: Text('Milik Sendiri (Owned)'),
                              ),
                              DropdownMenuItem(
                                value: 'FAMILY',
                                child: Text('Milik Keluarga (Family Owned)'),
                              ),
                              DropdownMenuItem(
                                value: 'RENT_ANNUAL',
                                child: Text('Sewa Tahunan (Contract)'),
                              ),
                              DropdownMenuItem(
                                value: 'RENT_MONTHLY',
                                child: Text('Kost / Sewa Bulanan'),
                              ),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _houseStatus = val);
                              }
                            },
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _incomeController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Estimated Net Monthly Income (Rp)',
                              prefixText: 'Rp ',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _expensesController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText:
                                  'Estimated Monthly Living Expenses (Rp)',
                              prefixText: 'Rp ',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _obligationsController,
                            decoration: const InputDecoration(
                              labelText:
                                  'Other Existing Installments / Obligations',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Field Physical Evidence & Photos
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: PhotoProofGridWidget(
                        requiredCategories: const [
                          'KTP Customer',
                          'Kartu Keluarga',
                          'Bukti Listrik / Air',
                          'Rumah & Pintu Depan',
                        ],
                        onPhotosChanged: (photos) {
                          _surveyPhotos = photos;
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Document Checks
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Field Physical Document Checks',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('Original KTP Verified on site'),
                            value: _ktpVerified,
                            onChanged: (v) =>
                                setState(() => _ktpVerified = v ?? false),
                          ),
                          CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('Kartu Keluarga (KK) verified'),
                            value: _kkVerified,
                            onChanged: (v) =>
                                setState(() => _kkVerified = v ?? false),
                          ),
                          CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text(
                              'Recent Electricity / Water Utility Bill matches address',
                            ),
                            value: _utilityBillVerified,
                            onChanged: (v) => setState(
                              () => _utilityBillVerified = v ?? false,
                            ),
                          ),
                          CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text(
                              'Proof of Income / Payslip / Bank Statement',
                            ),
                            value: _incomeProofVerified,
                            onChanged: (v) => setState(
                              () => _incomeProofVerified = v ?? false,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Final Assessment Notes
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Surveyor Assessment & Justification',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _assessmentNotes,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'Assessment Notes',
                              hintText:
                                  'Provide detailed justification for credit viability...',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Decision Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _submitDecision(false),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.error,
                            side: const BorderSide(color: AppColors.error),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          icon: const Icon(Icons.cancel_outlined),
                          label: const Text('Reject Credit'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _submitDecision(true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.secondary,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          icon: const Icon(Icons.check_circle_outline),
                          label: const Text('Approve Credit'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }
}
