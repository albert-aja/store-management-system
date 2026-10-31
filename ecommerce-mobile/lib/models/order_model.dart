class FulfillmentItem {
  final String productName;
  final String variantName;
  final String sku;
  final int quantity;
  final bool isProcurementRequired;
  final String procurementStatus;

  FulfillmentItem({
    required this.productName,
    required this.variantName,
    required this.sku,
    required this.quantity,
    required this.isProcurementRequired,
    required this.procurementStatus,
  });

  factory FulfillmentItem.fromJson(Map<String, dynamic> json) {
    return FulfillmentItem(
      productName: json['productName'] ?? '',
      variantName: json['variantName'] ?? '',
      sku: json['sku'] ?? '',
      quantity: json['quantity'] ?? 1,
      isProcurementRequired: json['isProcurementRequired'] ?? false,
      procurementStatus: json['procurementStatus'] ?? 'READY',
    );
  }
}

class FulfillmentGroupSummary {
  final String groupId;
  final int groupNumber;
  final String fulfillmentMethod;
  final String status;
  final String pickupStoreName;
  final List<FulfillmentItem> items;

  FulfillmentGroupSummary({
    required this.groupId,
    required this.groupNumber,
    required this.fulfillmentMethod,
    required this.status,
    required this.pickupStoreName,
    required this.items,
  });

  factory FulfillmentGroupSummary.fromJson(Map<String, dynamic> json) {
    final list =
        (json['items'] as List<dynamic>?)
            ?.map((e) => FulfillmentItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    return FulfillmentGroupSummary(
      groupId: json['groupId'] ?? '',
      groupNumber: json['groupNumber'] ?? 1,
      fulfillmentMethod: json['fulfillmentMethod'] ?? 'DELIVERY',
      status: json['status'] ?? 'PENDING',
      pickupStoreName: json['pickupStoreName'] ?? 'Central Showroom',
      items: list,
    );
  }
}

class OrderDetail {
  final String orderId;
  final String orderNumber;
  final String orderStatus;
  final double totalAmount;
  final double orderDiscountAmount;
  final String? orderDiscountLabel;
  final double requiredDepositAmount;
  final bool depositPaid;
  final String paymentMethod;
  final String fulfillmentPreference;
  final String customerName;
  final String customerPhone;
  final List<FulfillmentGroupSummary> fulfillmentGroups;

  OrderDetail({
    required this.orderId,
    required this.orderNumber,
    required this.orderStatus,
    required this.totalAmount,
    this.orderDiscountAmount = 0,
    this.orderDiscountLabel,
    required this.requiredDepositAmount,
    required this.depositPaid,
    required this.paymentMethod,
    required this.fulfillmentPreference,
    required this.customerName,
    required this.customerPhone,
    required this.fulfillmentGroups,
  });

  factory OrderDetail.fromJson(Map<String, dynamic> json) {
    final groups =
        (json['fulfillmentGroups'] as List<dynamic>?)
            ?.map(
              (e) =>
                  FulfillmentGroupSummary.fromJson(e as Map<String, dynamic>),
            )
            .toList() ??
        [];
    return OrderDetail(
      orderId: json['orderId'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      orderStatus: json['orderStatus'] ?? json['status'] ?? 'CONFIRMED',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      orderDiscountAmount:
          (json['orderDiscountAmount'] as num?)?.toDouble() ?? 0.0,
      orderDiscountLabel: json['orderDiscountLabel'],
      requiredDepositAmount:
          (json['requiredDepositAmount'] as num?)?.toDouble() ?? 0.0,
      depositPaid: json['depositPaid'] ?? false,
      paymentMethod: json['paymentMethod'] ?? 'QRIS',
      fulfillmentPreference: json['fulfillmentPreference'] ?? 'COMPLETE',
      customerName: json['customerName'] ?? 'Pelanggan Setia',
      customerPhone: json['customerPhone'] ?? '08123456789',
      fulfillmentGroups: groups,
    );
  }
}
