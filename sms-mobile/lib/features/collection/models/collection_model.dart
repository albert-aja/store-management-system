class CollectionTaskModel {
  final String id;
  final String customerId;
  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final String receivableId;
  final String receivableNumber;
  final double overdueAmount;
  final int daysOverdue;
  final int installmentNumber;
  final int totalInstallments;

  const CollectionTaskModel({
    required this.id,
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    required this.receivableId,
    required this.receivableNumber,
    required this.overdueAmount,
    required this.daysOverdue,
    required this.installmentNumber,
    required this.totalInstallments,
  });

  factory CollectionTaskModel.fromJson(Map<String, dynamic> json) {
    return CollectionTaskModel(
      id: json['id'] as String,
      customerId: json['customerId'] as String? ?? 'cust-01',
      customerName: json['customerName'] as String? ?? 'Customer',
      customerPhone: json['customerPhone'] as String? ?? '',
      customerAddress: json['customerAddress'] as String? ?? '',
      receivableId: json['receivableId'] as String? ?? json['id'] as String,
      receivableNumber: json['receivableNumber'] as String? ?? 'REC-${json['id']}',
      overdueAmount: (json['overdueAmount'] as num?)?.toDouble() ?? 450000.0,
      daysOverdue: (json['daysOverdue'] as num?)?.toInt() ?? 14,
      installmentNumber: (json['installmentNumber'] as num?)?.toInt() ?? 3,
      totalInstallments: (json['totalInstallments'] as num?)?.toInt() ?? 12,
    );
  }
}

class CustodyRecordModel {
  final String id;
  final String holderId;
  final double amount;
  final String status;
  final String? handoverNotes;

  const CustodyRecordModel({
    required this.id,
    required this.holderId,
    required this.amount,
    required this.status,
    this.handoverNotes,
  });

  factory CustodyRecordModel.fromJson(Map<String, dynamic> json) {
    return CustodyRecordModel(
      id: json['id'] as String,
      holderId: json['holderId'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'HELD_BY_COLLECTOR',
      handoverNotes: json['handoverNotes'] as String?,
    );
  }
}

