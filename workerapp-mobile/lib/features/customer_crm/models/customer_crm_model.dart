class PromiseToPayModel {
  final String id;
  final String customerId;
  final String? salesOrderId;
  final double promisedAmount;
  final DateTime promisedDate;
  final String status;
  final String? notes;
  final String? brokenReason;

  const PromiseToPayModel({
    required this.id,
    required this.customerId,
    this.salesOrderId,
    required this.promisedAmount,
    required this.promisedDate,
    required this.status,
    this.notes,
    this.brokenReason,
  });

  factory PromiseToPayModel.fromJson(Map<String, dynamic> json) {
    return PromiseToPayModel(
      id: json['id'] as String? ?? '',
      customerId: json['customerId'] as String? ?? '',
      salesOrderId: json['salesOrderId'] as String?,
      promisedAmount: (json['promisedAmount'] as num?)?.toDouble() ?? 0.0,
      promisedDate: json['promisedDate'] != null
          ? DateTime.tryParse(json['promisedDate'] as String) ?? DateTime.now()
          : DateTime.now(),
      status: json['status'] as String? ?? 'PENDING',
      notes: json['notes'] as String?,
      brokenReason: json['brokenReason'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'customerId': customerId,
    'salesOrderId': salesOrderId,
    'promisedAmount': promisedAmount,
    'promisedDate': promisedDate.toIso8601String().split('T')[0],
    'status': status,
    'notes': notes,
    'brokenReason': brokenReason,
  };
}

class CustomerInteractionModel {
  final String id;
  final String customerId;
  final String channel;
  final String direction;
  final String subject;
  final String outcome;
  final String? notes;
  final DateTime? createdAt;

  const CustomerInteractionModel({
    required this.id,
    required this.customerId,
    required this.channel,
    required this.direction,
    required this.subject,
    required this.outcome,
    this.notes,
    this.createdAt,
  });

  factory CustomerInteractionModel.fromJson(Map<String, dynamic> json) {
    return CustomerInteractionModel(
      id: json['id'] as String? ?? '',
      customerId: json['customerId'] as String? ?? '',
      channel: json['channel'] as String? ?? 'IN_PERSON',
      direction: json['direction'] as String? ?? 'OUTBOUND',
      subject: json['subject'] as String? ?? '',
      outcome: json['outcome'] as String? ?? 'REACHED',
      notes: json['notes'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'customerId': customerId,
    'channel': channel,
    'direction': direction,
    'subject': subject,
    'outcome': outcome,
    'notes': notes,
    'createdAt': createdAt?.toIso8601String(),
  };
}

class Customer360SummaryModel {
  final String id;
  final String nik;
  final String fullName;
  final String phone;
  final String address;
  final String segment;
  final String creditScoreGrade;
  final int creditScorePoints;
  final double clvAmount;
  final int totalOrdersCount;
  final double storeCreditBalance;
  final int pendingPtpCount;
  final int pendingFollowUpCount;
  final List<String> tags;
  final List<PromiseToPayModel> activePtps;
  final List<CustomerInteractionModel> recentInteractions;

  const Customer360SummaryModel({
    required this.id,
    required this.nik,
    required this.fullName,
    required this.phone,
    required this.address,
    required this.segment,
    required this.creditScoreGrade,
    required this.creditScorePoints,
    required this.clvAmount,
    required this.totalOrdersCount,
    required this.storeCreditBalance,
    required this.pendingPtpCount,
    required this.pendingFollowUpCount,
    required this.tags,
    required this.activePtps,
    required this.recentInteractions,
  });

  factory Customer360SummaryModel.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'] as Map<String, dynamic>? ?? json;

    final rawTags =
        (json['tags'] as List<dynamic>?)
            ?.map(
              (e) => e is Map<String, dynamic>
                  ? (e['tagName'] as String? ?? '')
                  : e.toString(),
            )
            .where((s) => s.isNotEmpty)
            .toList() ??
        [];

    final rawPtps =
        (json['promisesToPay'] as List<dynamic>?)
            ?.map((e) => PromiseToPayModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final rawInteractions =
        (json['recentInteractions'] as List<dynamic>?)
            ?.map(
              (e) =>
                  CustomerInteractionModel.fromJson(e as Map<String, dynamic>),
            )
            .toList() ??
        [];

    return Customer360SummaryModel(
      id: customer['id'] as String? ?? '',
      nik: customer['nik'] as String? ?? '-',
      fullName:
          customer['fullName'] as String? ?? customer['name'] as String? ?? '',
      phone: customer['phone'] as String? ?? '-',
      address: customer['address'] as String? ?? '-',
      segment: customer['segment'] as String? ?? 'STANDARD',
      creditScoreGrade: customer['creditScoreGrade'] as String? ?? 'B',
      creditScorePoints: (customer['creditScorePoints'] as num?)?.toInt() ?? 70,
      clvAmount: (customer['clvAmount'] as num?)?.toDouble() ?? 0.0,
      totalOrdersCount: (customer['totalOrdersCount'] as num?)?.toInt() ?? 0,
      storeCreditBalance:
          (json['storeCreditBalance'] as num?)?.toDouble() ?? 0.0,
      pendingPtpCount:
          (json['pendingPtpCount'] as num?)?.toInt() ??
          rawPtps.where((p) => p.status == 'PENDING').length,
      pendingFollowUpCount:
          (json['pendingFollowUpCount'] as num?)?.toInt() ?? 0,
      tags: rawTags,
      activePtps: rawPtps,
      recentInteractions: rawInteractions,
    );
  }
}
