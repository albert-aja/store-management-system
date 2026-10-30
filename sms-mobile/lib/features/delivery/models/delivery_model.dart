class DeliveryTripModel {
  final String id;
  final String tripNumber;
  final String storeId;
  final String driverId;
  final String? helperId;
  final String vehiclePlate;
  final String plannedDate;
  final String status;
  final String? notes;

  const DeliveryTripModel({
    required this.id,
    required this.tripNumber,
    required this.storeId,
    required this.driverId,
    this.helperId,
    required this.vehiclePlate,
    required this.plannedDate,
    required this.status,
    this.notes,
  });

  factory DeliveryTripModel.fromJson(Map<String, dynamic> json) {
    return DeliveryTripModel(
      id: json['id'] as String,
      tripNumber: json['tripNumber'] as String? ?? json['id'] as String,
      storeId: json['storeId'] as String? ?? '',
      driverId: json['driverId'] as String? ?? '',
      helperId: json['helperId'] as String?,
      vehiclePlate: json['vehiclePlate'] as String? ?? 'B 1234 SMS',
      plannedDate: json['plannedDate'] as String? ?? '',
      status: json['status'] as String? ?? 'DISPATCHED',
      notes: json['notes'] as String?,
    );
  }
}

class DeliveryOrderModel {
  final String id;
  final String deliveryOrderNumber;
  final String salesOrderId;
  final String? tripId;
  final String recipientName;
  final String recipientPhone;
  final String deliveryAddress;
  final double codAmount;
  final String status;
  final bool preInspectionPassed;
  final String? itemName;
  final String? serialNumber;
  final List<String> manifestSerials;

  const DeliveryOrderModel({
    required this.id,
    required this.deliveryOrderNumber,
    required this.salesOrderId,
    this.tripId,
    required this.recipientName,
    required this.recipientPhone,
    required this.deliveryAddress,
    required this.codAmount,
    required this.status,
    this.preInspectionPassed = false,
    this.itemName,
    this.serialNumber,
    this.manifestSerials = const [],
  });

  factory DeliveryOrderModel.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>?)
        ?.whereType<Map<String, dynamic>>()
        .toList();
    final firstItem = items?.firstOrNull;
    return DeliveryOrderModel(
      id: json['id'] as String,
      deliveryOrderNumber:
          json['deliveryOrderNumber'] as String? ?? 'DO-${json['id']}',
      salesOrderId: json['salesOrderId'] as String? ?? '',
      tripId: (json['tripId'] ?? json['deliveryTripId']) as String?,
      recipientName: json['recipientName'] as String? ?? 'Customer',
      recipientPhone: json['recipientPhone'] as String? ?? '',
      deliveryAddress:
          (json['deliveryAddress'] ?? json['destinationAddress']) as String? ??
          '',
      codAmount: (json['codAmount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'PENDING',
      preInspectionPassed: json['preInspectionPassed'] as bool? ?? false,
      itemName:
          (json['itemName'] ??
                  firstItem?['variantName'] ??
                  firstItem?['productName'])
              as String?,
      serialNumber:
          (json['serialNumber'] ?? firstItem?['manufacturerSerial']) as String?,
      manifestSerials: items
              ?.map((item) =>
                  (item['manufacturerSerial'] ?? item['stockUnitId'])
                      ?.toString() ??
                  '')
              .where((serial) => serial.isNotEmpty)
              .toList() ??
          const [],
    );
  }
}
