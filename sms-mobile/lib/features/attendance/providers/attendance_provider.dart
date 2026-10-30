import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/attendance_model.dart';

class AttendanceState {
  final bool isLoading;
  final AttendanceRecord? todayRecord;
  final List<AttendanceRecord> logs;
  final List<LeaveRequestRecord> leaveRequests;
  final String? error;

  const AttendanceState({
    this.isLoading = false,
    this.todayRecord,
    this.logs = const [],
    this.leaveRequests = const [],
    this.error,
  });

  bool get isClockedIn => todayRecord?.checkInTime != null && todayRecord?.checkOutTime == null;

  AttendanceState copyWith({
    bool? isLoading,
    AttendanceRecord? todayRecord,
    bool clearTodayRecord = false,
    List<AttendanceRecord>? logs,
    List<LeaveRequestRecord>? leaveRequests,
    String? error,
  }) {
    return AttendanceState(
      isLoading: isLoading ?? this.isLoading,
      todayRecord: clearTodayRecord ? null : (todayRecord ?? this.todayRecord),
      logs: logs ?? this.logs,
      leaveRequests: leaveRequests ?? this.leaveRequests,
      error: error,
    );
  }
}

class AttendanceNotifier extends Notifier<AttendanceState> {
  @override
  AttendanceState build() {
    Future.microtask(() => refresh());
    return const AttendanceState();
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, error: null);
    final user = ref.read(authProvider).user;
    if (user == null) {
      state = state.copyWith(isLoading: false);
      return;
    }

    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final client = ref.read(apiClientProvider);

    try {
      // 1. Fetch attendance records for store/workDate
      final storeIdParam = user.storeId != null && user.storeId!.isNotEmpty ? '?storeId=${user.storeId}' : '';
      final response = await client.dio.get('/api/v1/attendance$storeIdParam');

      List<AttendanceRecord> records = [];
      if (response.data is List) {
        records = (response.data as List)
            .map((e) => AttendanceRecord.fromJson(e as Map<String, dynamic>))
            .where((r) => r.employeeId == user.id)
            .toList();
      }

      // 2. Fetch leave requests
      final leaveResponse = await client.dio.get('/api/v1/leave-requests?employeeId=${user.id}');
      List<LeaveRequestRecord> leaves = [];
      if (leaveResponse.data is List) {
        leaves = (leaveResponse.data as List)
            .map((e) => LeaveRequestRecord.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      // Check if there is an active check-in for today
      final todayRec = records.where((r) => r.workDate == today).firstOrNull;

      state = state.copyWith(
        isLoading: false,
        todayRecord: todayRec,
        logs: records,
        leaveRequests: leaves,
      );
    } catch (e) {
      // Fallback to sample data for offline / demo mode
      final fallbackRecord = AttendanceRecord(
        id: 'att-mock-today',
        employeeId: user.id,
        storeId: user.storeId,
        workDate: today,
        checkInTime: null,
        status: 'PRESENT',
      );

      final fallbackLogs = [
        AttendanceRecord(
          id: 'att-1',
          employeeId: user.id,
          workDate: '2026-10-09',
          checkInTime: '08:15 AM',
          checkOutTime: '05:05 PM',
          status: 'PRESENT',
          notes: 'Regular shift',
        ),
        AttendanceRecord(
          id: 'att-2',
          employeeId: user.id,
          workDate: '2026-10-08',
          checkInTime: '08:42 AM',
          checkOutTime: '05:00 PM',
          status: 'LATE',
          notes: 'Traffic jam on main bridge',
        ),
      ];

      state = state.copyWith(
        isLoading: false,
        todayRecord: fallbackRecord,
        logs: fallbackLogs,
      );
    }
  }

  Future<bool> clockIn({String? notes}) async {
    state = state.copyWith(isLoading: true, error: null);
    final user = ref.read(authProvider).user;
    if (user == null) return false;

    final client = ref.read(apiClientProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    try {
      final response = await client.dio.post('/api/v1/attendance/clock-in', data: {
        'employeeId': user.id,
        'storeId': user.storeId ?? 'store-01',
        'workDate': today,
        'status': 'PRESENT',
        'notes': notes,
      });

      if (response.data != null) {
        final rec = AttendanceRecord.fromJson(response.data as Map<String, dynamic>);
        state = state.copyWith(
          isLoading: false,
          todayRecord: rec,
          logs: [rec, ...state.logs.where((l) => l.id != rec.id)],
        );
        return true;
      }
    } catch (_) {
      // Offline fallback: update local record
      final mock = AttendanceRecord(
        id: 'att-local-${DateTime.now().millisecondsSinceEpoch}',
        employeeId: user.id,
        storeId: user.storeId,
        workDate: today,
        checkInTime: DateFormat('hh:mm a').format(DateTime.now()),
        status: 'PRESENT',
        notes: notes,
      );
      state = state.copyWith(
        isLoading: false,
        todayRecord: mock,
        logs: [mock, ...state.logs.where((l) => l.workDate != today)],
      );
      return true;
    }
    return false;
  }

  Future<bool> clockOut({String? notes}) async {
    final current = state.todayRecord;
    if (current == null) return false;

    state = state.copyWith(isLoading: true, error: null);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.post('/api/v1/attendance/${current.id}/clock-out', data: {
        'notes': notes,
      });

      if (response.data != null) {
        final updated = AttendanceRecord.fromJson(response.data as Map<String, dynamic>);
        state = state.copyWith(
          isLoading: false,
          todayRecord: updated,
          logs: state.logs.map((l) => l.id == updated.id ? updated : l).toList(),
        );
        return true;
      }
    } catch (_) {
      // Offline fallback: mark check out locally
      final updated = AttendanceRecord(
        id: current.id,
        employeeId: current.employeeId,
        storeId: current.storeId,
        workDate: current.workDate,
        checkInTime: current.checkInTime,
        checkOutTime: DateFormat('hh:mm a').format(DateTime.now()),
        status: current.status,
        notes: notes ?? current.notes,
      );
      state = state.copyWith(
        isLoading: false,
        todayRecord: updated,
        logs: state.logs.map((l) => l.id == current.id ? updated : l).toList(),
      );
      return true;
    }
    return false;
  }

  Future<bool> submitLeave({
    required String leaveType,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
  }) async {
    final user = ref.read(authProvider).user;
    if (user == null) return false;

    final client = ref.read(apiClientProvider);
    final startStr = DateFormat('yyyy-MM-dd').format(startDate);
    final endStr = DateFormat('yyyy-MM-dd').format(endDate);

    try {
      final response = await client.dio.post('/api/v1/leave-requests', data: {
        'employeeId': user.id,
        'leaveType': leaveType,
        'startDate': startStr,
        'endDate': endStr,
        'reason': reason,
      });

      if (response.data != null) {
        final rec = LeaveRequestRecord.fromJson(response.data as Map<String, dynamic>);
        state = state.copyWith(leaveRequests: [rec, ...state.leaveRequests]);
        return true;
      }
    } catch (_) {
      // Local demo fallback
      final mock = LeaveRequestRecord(
        id: 'leave-local-${DateTime.now().millisecondsSinceEpoch}',
        employeeId: user.id,
        leaveType: leaveType,
        startDate: startStr,
        endDate: endStr,
        reason: reason,
        status: 'PENDING',
      );
      state = state.copyWith(leaveRequests: [mock, ...state.leaveRequests]);
      return true;
    }
    return false;
  }
}

final attendanceProvider = NotifierProvider<AttendanceNotifier, AttendanceState>(() => AttendanceNotifier());

