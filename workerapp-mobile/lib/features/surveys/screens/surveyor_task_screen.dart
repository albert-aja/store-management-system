import 'package:sms_mobile/core/localization/worker_message.dart';
import 'package:sms_mobile/core/localization/worker_format.dart';
import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/hardware/geo_location_service.dart';
import '../../../core/hardware/photo_proof_widget.dart';
import '../../../core/hardware/active_tracking_banner.dart';
import '../../../core/hardware/fleet_tracking_service.dart';
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
  final _obligationsController = TextEditingController();
  final _assessmentNotes = TextEditingController();
  bool _initializedDefaults = false;
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
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initializedDefaults) {
      _initializedDefaults = true;
      _obligationsController.text = context.l10n.none;
      _assessmentNotes.text = context.l10n.incomeDefault;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadSurveyData();
    Future.microtask(() {
      if (!mounted) return;
      ref
          .read(fleetTrackingProvider.notifier)
          .startTracking(
            taskType: 'SURVEY_TASK',
            taskCode: 'SV-${widget.surveyId}',
            geofenceTargets: [
              GeofenceTarget(
                id: 'surv-${widget.surveyId}',
                title: context.l10n.message441,
                address: 'Jl. Fatmawati Raya No. 102, Jakarta Selatan',
                latitude: -6.1825,
                longitude: 106.8355,
                radiusMeters: 300.0,
              ),
            ],
          );
    });
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
          SnackBar(
            content: Text(context.l10n.message442(context.errorText(error))),
          ),
        );
      }
    }
  }

  Future<void> _submitDecision(bool approved) async {
    final decisionStr = approved ? 'APPROVED' : 'REJECTED';
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(context.l10n.message443(context.uiCode(decisionStr))),
        content: Text(
          approved ? context.l10n.message444 : context.l10n.message445,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(context.l10n.message5),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: approved ? AppColors.secondary : AppColors.error,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              approved ? context.l10n.message446 : context.l10n.message447,
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSubmitting = true);
    await ref.read(fleetTrackingProvider.notifier).completeTracking();

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
          content: Text(context.l10n.message448(context.errorText(error))),
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
          destinationLongitude:
              _customerLocation?.longitude ?? location.longitude,
          alleyWidthMeters: double.tryParse(_alleyWidthController.text.trim()),
          stairClearanceMeters: double.tryParse(
            _stairClearanceController.text.trim(),
          ),
          gateAccessNotes: _gateAccessController.text.trim(),
        );
    if (!assessmentSaved) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message449),
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
              context.l10n.message450(
                context.uiCode(decisionStr),
                context.number(_surveyPhotos.length),
              ),
            ),
            backgroundColor: approved ? AppColors.secondary : AppColors.error,
          ),
        );
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n.message451),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.message452),
        actions: const [WorkerLanguageSwitcher()],
      ),
      body: _isSubmitting
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Task-Bounded GPS Tracking Status Banner
                  const ActiveTrackingBanner(),
                  const SizedBox(height: 12),

                  // Task-Bounded GPS Tracking Status Banner
                  const ActiveTrackingBanner(),
                  const SizedBox(height: 12),
                  // Customer Header Card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Task-Bounded GPS Tracking Status Banner
                          const ActiveTrackingBanner(),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // Task-Bounded GPS Tracking Status Banner
                              const ActiveTrackingBanner(),
                              const SizedBox(height: 12),
                              Text(
                                context.l10n.message453(
                                  (widget.surveyId).toString(),
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
                                  color: AppColors.accent.withValues(
                                    alpha: 0.15,
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  context.uiCode('ASSIGNED'),
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
                          Text(
                            context.l10n.message454,
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            context.l10n.message455,
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
                          // Task-Bounded GPS Tracking Status Banner
                          const ActiveTrackingBanner(),
                          const SizedBox(height: 12),
                          Text(
                            context.l10n.message456,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _customerLocation == null
                                ? context.l10n.message457
                                : context.l10n.message458(
                                    (context.number(
                                      _customerLocation!.latitude,
                                      decimals: 6,
                                    )).toString(),
                                    (context.number(
                                      _customerLocation!.longitude,
                                      decimals: 6,
                                    )).toString(),
                                    (context.number(
                                      _customerLocation!.accuracyMeters,
                                      decimals: 1,
                                    )).toString(),
                                  ),
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
                              label: Text(context.l10n.message459),
                            ),
                          ),
                          TextField(
                            controller: _alleyWidthController,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            decoration: InputDecoration(
                              labelText: context.l10n.message460,
                              suffixText: 'm',
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _stairClearanceController,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            decoration: InputDecoration(
                              labelText: context.l10n.message461,
                              suffixText: 'm',
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _gateAccessController,
                            maxLines: 2,
                            decoration: InputDecoration(
                              labelText: context.l10n.message462,
                              hintText: context.l10n.message463,
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
                          // Task-Bounded GPS Tracking Status Banner
                          const ActiveTrackingBanner(),
                          const SizedBox(height: 12),
                          Text(
                            context.l10n.message464,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 14),
                          DropdownButtonFormField<String>(
                            initialValue: _houseStatus,
                            decoration: InputDecoration(
                              labelText: context.l10n.message465,
                            ),
                            items: [
                              DropdownMenuItem(
                                value: 'OWNED',
                                child: Text(context.l10n.message466),
                              ),
                              DropdownMenuItem(
                                value: 'FAMILY',
                                child: Text(context.l10n.message467),
                              ),
                              DropdownMenuItem(
                                value: 'RENT_ANNUAL',
                                child: Text(context.l10n.message468),
                              ),
                              DropdownMenuItem(
                                value: 'RENT_MONTHLY',
                                child: Text(context.l10n.message469),
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
                            decoration: InputDecoration(
                              labelText: context.l10n.message470,
                              prefixText: 'Rp ',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _expensesController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: context.l10n.message471,
                              prefixText: 'Rp ',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _obligationsController,
                            decoration: InputDecoration(
                              labelText: context.l10n.message472,
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
                          // Task-Bounded GPS Tracking Status Banner
                          const ActiveTrackingBanner(),
                          const SizedBox(height: 12),
                          Text(
                            context.l10n.message477,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(context.l10n.message478),
                            value: _ktpVerified,
                            onChanged: (v) =>
                                setState(() => _ktpVerified = v ?? false),
                          ),
                          CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(context.l10n.message479),
                            value: _kkVerified,
                            onChanged: (v) =>
                                setState(() => _kkVerified = v ?? false),
                          ),
                          CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(context.l10n.message480),
                            value: _utilityBillVerified,
                            onChanged: (v) => setState(
                              () => _utilityBillVerified = v ?? false,
                            ),
                          ),
                          CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(context.l10n.message481),
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
                          // Task-Bounded GPS Tracking Status Banner
                          const ActiveTrackingBanner(),
                          const SizedBox(height: 12),
                          Text(
                            context.l10n.message482,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _assessmentNotes,
                            maxLines: 3,
                            decoration: InputDecoration(
                              labelText: context.l10n.message483,
                              hintText: context.l10n.message484,
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
                      // Task-Bounded GPS Tracking Status Banner
                      const ActiveTrackingBanner(),
                      const SizedBox(height: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _submitDecision(false),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.error,
                            side: const BorderSide(color: AppColors.error),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          icon: const Icon(Icons.cancel_outlined),
                          label: Text(context.l10n.message485),
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
                          label: Text(context.l10n.message486),
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
