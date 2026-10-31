class PickupPassItem {
  final String productName;
  final String variantName;
  final String sku;
  final int quantity;
  final bool procurementRequired;

  PickupPassItem({
    required this.productName,
    required this.variantName,
    required this.sku,
    required this.quantity,
    required this.procurementRequired,
  });

  factory PickupPassItem.fromJson(Map<String, dynamic> json) {
    return PickupPassItem(
      productName: json['productName'] ?? '',
      variantName: json['variantName'] ?? '',
      sku: json['sku'] ?? '',
      quantity: json['quantity'] ?? 1,
      procurementRequired: json['procurementRequired'] ?? false,
    );
  }
}

class PickupPass {
  final String orderNumber;
  final String fulfillmentGroupId;
  final int groupNumber;
  final String? pickupStoreId;
  final String pickupStoreCode;
  final String pickupStoreName;
  final String pickupStoreAddress;
  final String operatingHours;
  final String contactPhone;
  final String pickupPassCode;
  final String qrPayload;
  final String stagingStatus;
  final String stagingRackLocation;
  final DateTime? stagedAt;
  final DateTime? handedOverAt;
  final String? handedOverByStaffName;
  final String recipientName;
  final String recipientPhone;
  final double totalAmount;
  final double requiredDepositAmount;
  final bool depositPaid;
  final double remainingBalance;
  final bool fullyPaid;
  final bool readyForCollection;
  final List<PickupPassItem> items;

  PickupPass({
    required this.orderNumber,
    required this.fulfillmentGroupId,
    required this.groupNumber,
    this.pickupStoreId,
    required this.pickupStoreCode,
    required this.pickupStoreName,
    required this.pickupStoreAddress,
    required this.operatingHours,
    required this.contactPhone,
    required this.pickupPassCode,
    required this.qrPayload,
    required this.stagingStatus,
    required this.stagingRackLocation,
    this.stagedAt,
    this.handedOverAt,
    this.handedOverByStaffName,
    required this.recipientName,
    required this.recipientPhone,
    required this.totalAmount,
    required this.requiredDepositAmount,
    required this.depositPaid,
    required this.remainingBalance,
    required this.fullyPaid,
    required this.readyForCollection,
    required this.items,
  });

  factory PickupPass.fromJson(Map<String, dynamic> json) {
    return PickupPass(
      orderNumber: json['orderNumber'] ?? '',
      fulfillmentGroupId: json['fulfillmentGroupId'] ?? '',
      groupNumber: json['groupNumber'] ?? 1,
      pickupStoreId: json['pickupStoreId'],
      pickupStoreCode: json['pickupStoreCode'] ?? 'SHOWROOM-01',
      pickupStoreName: json['pickupStoreName'] ?? 'SMS Mart Showroom Central',
      pickupStoreAddress:
          json['pickupStoreAddress'] ??
          'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan',
      operatingHours:
          json['operatingHours'] ?? 'Senin - Minggu: 09:00 - 21:00 WIB',
      contactPhone: json['contactPhone'] ?? '+62 21 555-0199',
      pickupPassCode: json['pickupPassCode'] ?? 'PKP-8921-9988',
      qrPayload: json['qrPayload'] ?? 'SMS-PICKUP:SO-APP:1:PKP',
      stagingStatus: json['stagingStatus'] ?? 'AWAITING_STAGING',
      stagingRackLocation:
          json['stagingRackLocation'] ?? 'Area Staging Showroom',
      stagedAt: json['stagedAt'] != null
          ? DateTime.tryParse(json['stagedAt'])
          : null,
      handedOverAt: json['handedOverAt'] != null
          ? DateTime.tryParse(json['handedOverAt'])
          : null,
      handedOverByStaffName: json['handedOverByStaffName'],
      recipientName: json['recipientName'] ?? 'Customer',
      recipientPhone: json['recipientPhone'] ?? '-',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      requiredDepositAmount:
          (json['requiredDepositAmount'] as num?)?.toDouble() ?? 0.0,
      depositPaid: json['depositPaid'] ?? false,
      remainingBalance: (json['remainingBalance'] as num?)?.toDouble() ?? 0.0,
      fullyPaid: json['fullyPaid'] ?? false,
      readyForCollection: json['readyForCollection'] ?? false,
      items:
          (json['items'] as List<dynamic>?)
              ?.map((e) => PickupPassItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  PickupPass copyWith({
    String? stagingStatus,
    String? stagingRackLocation,
    DateTime? stagedAt,
    DateTime? handedOverAt,
    String? handedOverByStaffName,
    double? remainingBalance,
    bool? fullyPaid,
    bool? readyForCollection,
  }) {
    return PickupPass(
      orderNumber: orderNumber,
      fulfillmentGroupId: fulfillmentGroupId,
      groupNumber: groupNumber,
      pickupStoreId: pickupStoreId,
      pickupStoreCode: pickupStoreCode,
      pickupStoreName: pickupStoreName,
      pickupStoreAddress: pickupStoreAddress,
      operatingHours: operatingHours,
      contactPhone: contactPhone,
      pickupPassCode: pickupPassCode,
      qrPayload: qrPayload,
      stagingStatus: stagingStatus ?? this.stagingStatus,
      stagingRackLocation: stagingRackLocation ?? this.stagingRackLocation,
      stagedAt: stagedAt ?? this.stagedAt,
      handedOverAt: handedOverAt ?? this.handedOverAt,
      handedOverByStaffName:
          handedOverByStaffName ?? this.handedOverByStaffName,
      recipientName: recipientName,
      recipientPhone: recipientPhone,
      totalAmount: totalAmount,
      requiredDepositAmount: requiredDepositAmount,
      depositPaid: depositPaid,
      remainingBalance: remainingBalance ?? this.remainingBalance,
      fullyPaid: fullyPaid ?? this.fullyPaid,
      readyForCollection: readyForCollection ?? this.readyForCollection,
      items: items,
    );
  }
}
