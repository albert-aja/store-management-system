class PayrollSlipModel {
  final String id;
  final String payrollPeriodId;
  final String periodName;
  final String employeeId;
  final double baseSalary;
  final double attendanceDeductions;
  final double salesCommission;
  final double collectionIncentive;
  final double otherAllowances;
  final double netSalary;
  final String status;
  final String cutoffDate;
  final String payoutDate;

  const PayrollSlipModel({
    required this.id,
    required this.payrollPeriodId,
    required this.periodName,
    required this.employeeId,
    required this.baseSalary,
    required this.attendanceDeductions,
    required this.salesCommission,
    required this.collectionIncentive,
    required this.otherAllowances,
    required this.netSalary,
    required this.status,
    required this.cutoffDate,
    required this.payoutDate,
  });

  factory PayrollSlipModel.fromJson(Map<String, dynamic> json) {
    return PayrollSlipModel(
      id: json['id'] as String,
      payrollPeriodId: json['payrollPeriodId'] as String? ?? 'prd-01',
      periodName: json['periodName'] as String? ?? 'October 2026 Sales Period',
      employeeId: json['employeeId'] as String? ?? '',
      baseSalary: (json['baseSalary'] as num?)?.toDouble() ?? 5000000.0,
      attendanceDeductions:
          (json['attendanceDeductions'] as num?)?.toDouble() ?? 0.0,
      salesCommission:
          (json['salesCommission'] as num?)?.toDouble() ?? 1250000.0,
      collectionIncentive:
          (json['collectionIncentive'] as num?)?.toDouble() ?? 350000.0,
      otherAllowances:
          (json['otherAllowances'] as num?)?.toDouble() ?? 500000.0,
      netSalary: (json['netSalary'] as num?)?.toDouble() ?? 7100000.0,
      status: json['status'] as String? ?? 'PAID',
      cutoffDate: json['cutoffDate'] as String? ?? '2026-11-01',
      payoutDate: json['payoutDate'] as String? ?? '2026-11-02',
    );
  }
}
