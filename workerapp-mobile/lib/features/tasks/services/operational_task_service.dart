import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/operational_task_model.dart';
import '../../../core/network/api_client.dart';
import '../../auth/providers/auth_provider.dart';

final operationalTaskServiceProvider = Provider<OperationalTaskService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return OperationalTaskService(apiClient);
});

class OperationalTaskService {
  final ApiClient _apiClient;

  // Local state cache / fallback for demo & offline testing
  final List<OperationalTaskModel> _localTasks = [
    OperationalTaskModel(
      id: 'tsk-001',
      taskNumber: 'TSK-202611-1001',
      title: 'Persiapan Display Sofa L-Shape',
      description: 'Tata unit display sofa baru di area depan showroom cabang.',
      category: 'SHOWROOM_DISPLAY',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: DateTime.now().add(const Duration(days: 2)),
      assignerId: 'emp-001',
      assignerName: 'Supervisor Budi',
      assigneeId: 'emp-002',
      assigneeName: 'Staff Lapangan',
      commentCount: 1,
      isOverdue: false,
      comments: [
        TaskCommentModel(
          id: 'comm-101',
          taskId: 'tsk-001',
          authorId: 'emp-001',
          authorName: 'Supervisor Budi',
          message: 'Tolong pastikan jarak lorong jalan minimal 80 cm ya.',
          createdAt: DateTime.now().subtract(const Duration(hours: 3)),
        ),
      ],
    ),
    OperationalTaskModel(
      id: 'tsk-002',
      taskNumber: 'TSK-202611-1002',
      title: 'Audit Stok Meja Makan 6 Kursi',
      description: 'Lakukan stock opname fisik di Bay 3 untuk verifikasi selisih sistem.',
      category: 'STOCK_AUDIT',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      dueDate: DateTime.now().subtract(const Duration(days: 1)),
      assignerId: 'emp-001',
      assignerName: 'Supervisor Budi',
      assigneeId: 'emp-002',
      assigneeName: 'Staff Lapangan',
      commentCount: 0,
      isOverdue: true,
      comments: [],
    ),
    OperationalTaskModel(
      id: 'tsk-003',
      taskNumber: 'TSK-202611-1003',
      title: 'Pengecekan Engsel Pintu Lemari Defect',
      description: 'Periksa keluhan pelanggan terkait baut engsel kendur sebelum pengiriman ulang.',
      category: 'MAINTENANCE',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      dueDate: DateTime.now().subtract(const Duration(days: 3)),
      assignerId: 'emp-001',
      assignerName: 'Supervisor Budi',
      assigneeId: 'emp-002',
      assigneeName: 'Staff Lapangan',
      completedAt: DateTime.now().subtract(const Duration(days: 2)),
      completionNotes: 'Engsel sudah diganti dengan part baru dan dikalibrasi.',
      commentCount: 0,
      isOverdue: false,
      comments: [],
    ),
  ];

  OperationalTaskService(this._apiClient);

  Future<List<OperationalTaskModel>> fetchTasks({
    String? status,
    String? priority,
    String? category,
  }) async {
    try {
      final response = await _apiClient.dio.get('/api/v1/tasks', queryParameters: {
        if (status != null && status != 'ALL') 'status': status,
        if (priority != null && priority != 'ALL') 'priority': priority,
        if (category != null && category != 'ALL') 'category': category,
      });

      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map((e) => OperationalTaskModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {
      // Fallback to local cache in offline/unit testing
    }

    return _localTasks.where((t) {
      if (status != null && status != 'ALL' && t.status != status) return false;
      if (priority != null && priority != 'ALL' && t.priority != priority) return false;
      if (category != null && category != 'ALL' && t.category != category) return false;
      return true;
    }).toList();
  }

  Future<OperationalTaskModel?> getTaskDetail(String taskId) async {
    try {
      final response = await _apiClient.dio.get('/api/v1/tasks/$taskId');
      if (response.statusCode == 200 && response.data != null) {
        return OperationalTaskModel.fromJson(response.data as Map<String, dynamic>);
      }
    } catch (_) {}

    try {
      return _localTasks.firstWhere((t) => t.id == taskId);
    } catch (_) {
      return null;
    }
  }

  Future<OperationalTaskModel> updateStatus(
    String taskId,
    String newStatus, {
    String? completionNotes,
  }) async {
    try {
      final response = await _apiClient.dio.patch('/api/v1/tasks/$taskId/status', data: {
        'status': newStatus,
        'completionNotes': completionNotes,
      });
      if (response.statusCode == 200 && response.data != null) {
        return OperationalTaskModel.fromJson(response.data as Map<String, dynamic>);
      }
    } catch (_) {}

    final index = _localTasks.indexWhere((t) => t.id == taskId);
    if (index != -1) {
      final updated = _localTasks[index].copyWith(
        status: newStatus,
        completedAt: newStatus == 'COMPLETED' ? DateTime.now() : null,
        completionNotes: completionNotes,
      );
      _localTasks[index] = updated;
      return updated;
    }

    throw Exception('Task not found: $taskId');
  }

  Future<TaskCommentModel> addComment(
    String taskId,
    String message, {
    String? attachmentUrl,
  }) async {
    try {
      final response = await _apiClient.dio.post('/api/v1/tasks/$taskId/comments', data: {
        'message': message,
        'attachmentUrl': attachmentUrl,
      });
      if (response.statusCode == 201 && response.data != null) {
        return TaskCommentModel.fromJson(response.data as Map<String, dynamic>);
      }
    } catch (_) {}

    final newComment = TaskCommentModel(
      id: 'comm-${DateTime.now().millisecondsSinceEpoch}',
      taskId: taskId,
      authorId: 'emp-002',
      authorName: 'Staff Lapangan',
      message: message,
      attachmentUrl: attachmentUrl,
      createdAt: DateTime.now(),
    );

    final index = _localTasks.indexWhere((t) => t.id == taskId);
    if (index != -1) {
      final current = _localTasks[index];
      _localTasks[index] = current.copyWith(
        comments: [...current.comments, newComment],
        commentCount: current.commentCount + 1,
      );
    }

    return newComment;
  }
}
