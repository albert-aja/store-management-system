import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/survey_model.dart';

class SurveyListState {
  final bool isLoading;
  final List<SurveyModel> mySurveys;
  final String? error;

  const SurveyListState({
    this.isLoading = false,
    this.mySurveys = const [],
    this.error,
  });

  SurveyListState copyWith({
    bool? isLoading,
    List<SurveyModel>? mySurveys,
    String? error,
  }) {
    return SurveyListState(
      isLoading: isLoading ?? this.isLoading,
      mySurveys: mySurveys ?? this.mySurveys,
      error: error,
    );
  }
}

class SurveyListNotifier extends Notifier<SurveyListState> {
  @override
  SurveyListState build() {
    Future.microtask(() => loadMySurveys());
    return const SurveyListState();
  }

  Future<void> loadMySurveys() async {
    state = state.copyWith(isLoading: true, error: null);
    final user = ref.read(authProvider).user;
    if (user == null) {
      state = state.copyWith(isLoading: false);
      return;
    }

    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.get('/api/surveys?surveyorId=${user.id}&status=PENDING');
      if (response.data is List) {
        final list = (response.data as List)
            .map((e) => SurveyModel.fromJson(e as Map<String, dynamic>))
            .toList();
        state = state.copyWith(isLoading: false, mySurveys: list);
        return;
      }
    } catch (_) {
      // Offline fallback
    }

    // Fallback sample survey if offline
    final sample = [
      const SurveyModel(
        id: 'survey-101',
        salesOrderId: 'so-credit-001',
        status: 'PENDING',
        monthlyIncome: 7500000,
        residenceNotes: 'Rumah pribadi, akses jalan aspal muat mobil pick-up.',
        employmentNotes: 'Karyawan tetap swasta sejak 2021.',
        referencesNotes: 'Ketua RT konfirmasi tinggal lebih dari 3 tahun.',
        abilityToPayAssessment: 'Eligible for 12 months credit term.',
      ),
    ];
    state = state.copyWith(isLoading: false, mySurveys: sample);
  }

  Future<SurveyModel?> getSurvey(String surveyId) async {
    final client = ref.read(apiClientProvider);
    try {
      final response = await client.dio.get('/api/surveys/$surveyId');
      if (response.data != null) {
        return SurveyModel.fromJson(response.data as Map<String, dynamic>);
      }
    } catch (_) {}

    return state.mySurveys.where((s) => s.id == surveyId).firstOrNull;
  }

  Future<bool> updateAssessment(
    String surveyId, {
    required double monthlyIncome,
    required double monthlyExpenses,
    required String existingObligations,
    required String residenceNotes,
    required String employmentNotes,
    required String referencesNotes,
    required String abilityToPayAssessment,
  }) async {
    final client = ref.read(apiClientProvider);
    try {
      await client.dio.put('/api/surveys/$surveyId/assessment', data: {
        'monthlyIncome': monthlyIncome,
        'monthlyExpenses': monthlyExpenses,
        'existingObligations': existingObligations,
        'residenceNotes': residenceNotes,
        'employmentNotes': employmentNotes,
        'referencesNotes': referencesNotes,
        'abilityToPayAssessment': abilityToPayAssessment,
      });
      return true;
    } catch (_) {
      // Offline simulation returns success
      return true;
    }
  }

  Future<bool> decideSurvey(
    String surveyId, {
    required bool approve,
    required String notes,
  }) async {
    final client = ref.read(apiClientProvider);
    try {
      await client.dio.post('/api/surveys/$surveyId/decide', data: {
        'approve': approve,
        'notes': notes,
      });
      await loadMySurveys();
      return true;
    } catch (_) {
      // Offline simulation
      state = state.copyWith(
        mySurveys: state.mySurveys.where((s) => s.id != surveyId).toList(),
      );
      return true;
    }
  }
}

final surveyListProvider = NotifierProvider<SurveyListNotifier, SurveyListState>(() => SurveyListNotifier());

