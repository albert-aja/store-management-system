class DeliveryRescheduleRequest {
  final String id;
  final String requestedDate;
  final String requestedWindow;
  final String status;
  final String? decisionNotes;

  const DeliveryRescheduleRequest({
    required this.id,
    required this.requestedDate,
    required this.requestedWindow,
    required this.status,
    this.decisionNotes,
  });

  factory DeliveryRescheduleRequest.fromJson(Map<String, dynamic> json) =>
      DeliveryRescheduleRequest(
        id: json['id'] as String,
        requestedDate: json['requestedDate'] as String,
        requestedWindow: json['requestedWindow'] as String,
        status: json['status'] as String,
        decisionNotes: json['decisionNotes'] as String?,
      );
}

class DeliverySchedule {
  final String deliveryOrderId;
  final String deliveryOrderNumber;
  final String? plannedDispatchAt;
  final String? deliveryDate;
  final String? deliveryWindow;
  final bool eligible;
  final String? unavailableReason;
  final List<DeliveryRescheduleRequest> requests;

  const DeliverySchedule({
    required this.deliveryOrderId,
    required this.deliveryOrderNumber,
    this.plannedDispatchAt,
    this.deliveryDate,
    this.deliveryWindow,
    required this.eligible,
    this.unavailableReason,
    this.requests = const [],
  });

  factory DeliverySchedule.fromJson(Map<String, dynamic> json) =>
      DeliverySchedule(
        deliveryOrderId: json['deliveryOrderId'] as String,
        deliveryOrderNumber: json['deliveryOrderNumber'] as String,
        plannedDispatchAt: json['plannedDispatchAt'] as String?,
        deliveryDate: json['deliveryDate'] as String?,
        deliveryWindow: json['deliveryWindow'] as String?,
        eligible: json['eligible'] as bool,
        unavailableReason: json['unavailableReason'] as String?,
        requests: (json['requests'] as List)
            .map(
              (item) => DeliveryRescheduleRequest.fromJson(
                Map<String, dynamic>.from(item as Map),
              ),
            )
            .toList(),
      );
}
