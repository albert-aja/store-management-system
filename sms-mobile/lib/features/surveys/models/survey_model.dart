class SurveyModel {
  final String id;
  final String salesOrderId;
  final String? surveyorEmployeeId;
  final String status;
  final double? monthlyIncome;
  final double? monthlyExpenses;
  final String? existingObligations;
  final String? residenceNotes;
  final String? employmentNotes;
  final String? referencesNotes;
  final String? abilityToPayAssessment;
  final String? decidedAt;
  final String? decisionNotes;

  const SurveyModel({
    required this.id,
    required this.salesOrderId,
    this.surveyorEmployeeId,
    required this.status,
    this.monthlyIncome,
    this.monthlyExpenses,
    this.existingObligations,
    this.residenceNotes,
    this.employmentNotes,
    this.referencesNotes,
    this.abilityToPayAssessment,
    this.decidedAt,
    this.decisionNotes,
  });

  factory SurveyModel.fromJson(Map<String, dynamic> json) {
    return SurveyModel(
      id: json['id'] as String,
      salesOrderId: json['salesOrderId'] as String,
      surveyorEmployeeId: json['surveyorEmployeeId'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      monthlyIncome: (json['monthlyIncome'] as num?)?.toDouble(),
      monthlyExpenses: (json['monthlyExpenses'] as num?)?.toDouble(),
      existingObligations: json['existingObligations'] as String?,
      residenceNotes: json['residenceNotes'] as String?,
      employmentNotes: json['employmentNotes'] as String?,
      referencesNotes: json['referencesNotes'] as String?,
      abilityToPayAssessment: json['abilityToPayAssessment'] as String?,
      decidedAt: json['decidedAt'] as String?,
      decisionNotes: json['decisionNotes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'salesOrderId': salesOrderId,
      'surveyorEmployeeId': surveyorEmployeeId,
      'status': status,
      'monthlyIncome': monthlyIncome,
      'monthlyExpenses': monthlyExpenses,
      'existingObligations': existingObligations,
      'residenceNotes': residenceNotes,
      'employmentNotes': employmentNotes,
      'referencesNotes': referencesNotes,
      'abilityToPayAssessment': abilityToPayAssessment,
      'decidedAt': decidedAt,
      'decisionNotes': decisionNotes,
    };
  }
}

