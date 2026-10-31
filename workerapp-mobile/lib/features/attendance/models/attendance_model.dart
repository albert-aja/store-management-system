class AttendanceRecord {
  final String id;
  final String employeeId;
  final String? storeId;
  final String workDate;
  final String? checkInTime;
  final String? checkOutTime;
  final String status;
  final String? notes;

  const AttendanceRecord({
    required this.id,
    required this.employeeId,
    this.storeId,
    required this.workDate,
    this.checkInTime,
    this.checkOutTime,
    required this.status,
    this.notes,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id'] as String,
      employeeId: json['employeeId'] as String,
      storeId: json['storeId'] as String?,
      workDate: json['workDate'] as String,
      checkInTime: json['checkInTime'] as String?,
      checkOutTime: json['checkOutTime'] as String?,
      status: json['status'] as String? ?? 'PRESENT',
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employeeId': employeeId,
      'storeId': storeId,
      'workDate': workDate,
      'checkInTime': checkInTime,
      'checkOutTime': checkOutTime,
      'status': status,
      'notes': notes,
    };
  }
}

class LeaveRequestRecord {
  final String id;
  final String employeeId;
  final String leaveType;
  final String startDate;
  final String endDate;
  final String? reason;
  final String status;

  const LeaveRequestRecord({
    required this.id,
    required this.employeeId,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    this.reason,
    required this.status,
  });

  factory LeaveRequestRecord.fromJson(Map<String, dynamic> json) {
    return LeaveRequestRecord(
      id: json['id'] as String,
      employeeId: json['employeeId'] as String,
      leaveType: json['leaveType'] as String,
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      reason: json['reason'] as String?,
      status: json['status'] as String? ?? 'PENDING',
    );
  }
}
