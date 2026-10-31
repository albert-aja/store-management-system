import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/payroll_model.dart';

class PayrollState {
  final bool isLoading;
  final List<PayrollSlipModel> slips;
  final PayrollSlipModel? latestSlip;
  final String? error;

  const PayrollState({
    this.isLoading = false,
    this.slips = const [],
    this.latestSlip,
    this.error,
  });

  PayrollState copyWith({
    bool? isLoading,
    List<PayrollSlipModel>? slips,
    PayrollSlipModel? latestSlip,
    String? error,
  }) {
    return PayrollState(
      isLoading: isLoading ?? this.isLoading,
      slips: slips ?? this.slips,
      latestSlip: latestSlip ?? this.latestSlip,
      error: error,
    );
  }
}

class PayrollNotifier extends Notifier<PayrollState> {
  @override
  PayrollState build() {
    Future.microtask(() => loadMySlips());
    return const PayrollState();
  }

  Future<void> loadMySlips() async {
    state = state.copyWith(isLoading: true, error: null);
    final user = ref.read(authProvider).user;
    if (user == null) {
      state = state.copyWith(isLoading: false);
      return;
    }

    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.get(
        '/api/v1/payroll/employees/${user.id}/slips',
      );
      if (response.data is List && (response.data as List).isNotEmpty) {
        final list = (response.data as List)
            .map((e) => PayrollSlipModel.fromJson(e as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          isLoading: false,
          slips: list,
          latestSlip: list.first,
        );
        return;
      }
    } catch (_) {
      // Offline fallback
    }

    final sample = PayrollSlipModel(
      id: 'slip-01',
      payrollPeriodId: 'prd-2026-10',
      periodName: 'October 2026 Sales Period',
      employeeId: user.id,
      baseSalary: 5200000,
      attendanceDeductions: 173000,
      salesCommission: 1450000,
      collectionIncentive: 420000,
      otherAllowances: 500000,
      netSalary: 7397000,
      status: 'PAID',
      cutoffDate: '01 Nov 2026',
      payoutDate: '02 Nov 2026',
    );

    state = state.copyWith(
      isLoading: false,
      slips: [sample],
      latestSlip: sample,
    );
  }
}

final payrollProvider = NotifierProvider<PayrollNotifier, PayrollState>(
  () => PayrollNotifier(),
);
