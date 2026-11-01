import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sms_mobile/core/network/api_client.dart';
import 'package:sms_mobile/features/tasks/models/operational_task_model.dart';
import 'package:sms_mobile/features/tasks/screens/operational_task_detail_screen.dart';
import 'package:sms_mobile/features/tasks/services/operational_task_service.dart';
import 'package:sms_mobile/l10n/app_localizations.dart';

class MockOperationalTaskService extends OperationalTaskService {
  final List<OperationalTaskModel> _tasks;

  MockOperationalTaskService()
      : _tasks = [
          OperationalTaskModel(
            id: 'tsk-001',
            taskNumber: 'TSK-202611-1001',
            title: 'Persiapan Display Sofa L-Shape',
            description: 'Tata unit display sofa di area depan',
            category: 'SHOWROOM_DISPLAY',
            priority: 'HIGH',
            status: 'PENDING',
            dueDate: DateTime(2026, 11, 5),
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
                message: 'Pastikan jarak lorong jalan minimal 80 cm ya.',
                createdAt: DateTime(2026, 11, 1, 8, 30),
              ),
            ],
          ),
        ],
        super(ApiClient());

  @override
  Future<List<OperationalTaskModel>> fetchTasks({
    String? status,
    String? priority,
    String? category,
  }) async {
    return _tasks;
  }

  @override
  Future<OperationalTaskModel?> getTaskDetail(String taskId) async {
    try {
      return _tasks.firstWhere((t) => t.id == taskId);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<OperationalTaskModel> updateStatus(
    String taskId,
    String newStatus, {
    String? completionNotes,
  }) async {
    final index = _tasks.indexWhere((t) => t.id == taskId);
    final updated = _tasks[index].copyWith(
      status: newStatus,
      completedAt: newStatus == 'COMPLETED' ? DateTime.now() : null,
      completionNotes: completionNotes,
    );
    _tasks[index] = updated;
    return updated;
  }

  @override
  Future<TaskCommentModel> addComment(
    String taskId,
    String message, {
    String? attachmentUrl,
  }) async {
    final newComment = TaskCommentModel(
      id: 'comm-${DateTime.now().millisecondsSinceEpoch}',
      taskId: taskId,
      authorId: 'emp-002',
      authorName: 'Staff Lapangan',
      message: message,
      attachmentUrl: attachmentUrl,
      createdAt: DateTime.now(),
    );
    final index = _tasks.indexWhere((t) => t.id == taskId);
    _tasks[index] = _tasks[index].copyWith(
      comments: [..._tasks[index].comments, newComment],
      commentCount: _tasks[index].commentCount + 1,
    );
    return newComment;
  }
}

void main() {
  group('OperationalTaskModel & Service Unit Tests', () {
    test('JSON serialization & deserialization works correctly', () {
      final json = {
        'id': 'tsk-001',
        'taskNumber': 'TSK-202611-1001',
        'title': 'Persiapan Display Sofa L-Shape',
        'description': 'Tata unit display sofa di area depan',
        'category': 'SHOWROOM_DISPLAY',
        'priority': 'HIGH',
        'status': 'PENDING',
        'dueDate': '2026-11-05T12:00:00Z',
        'assignerId': 'emp-001',
        'assignerName': 'Supervisor Budi',
        'assigneeId': 'emp-002',
        'assigneeName': 'Staff Siti',
        'storeId': 'store-001',
        'commentCount': 1,
        'isOverdue': false,
        'comments': [
          {
            'id': 'comm-001',
            'taskId': 'tsk-001',
            'authorId': 'emp-001',
            'authorName': 'Supervisor Budi',
            'message': 'Pastikan jarak lorong jalan cukup',
            'createdAt': '2026-11-01T08:00:00Z',
          }
        ],
      };

      final task = OperationalTaskModel.fromJson(json);

      expect(task.id, 'tsk-001');
      expect(task.taskNumber, 'TSK-202611-1001');
      expect(task.title, 'Persiapan Display Sofa L-Shape');
      expect(task.category, 'SHOWROOM_DISPLAY');
      expect(task.priority, 'HIGH');
      expect(task.status, 'PENDING');
      expect(task.comments.length, 1);
      expect(task.comments.first.message, 'Pastikan jarak lorong jalan cukup');

      final updated = task.copyWith(
        status: 'COMPLETED',
        completionNotes: 'Display selesai rapi',
      );
      expect(updated.status, 'COMPLETED');
      expect(updated.completionNotes, 'Display selesai rapi');
    });

    test('OperationalTaskService mock lists tasks and adds comments', () async {
      final service = MockOperationalTaskService();

      final tasks = await service.fetchTasks();
      expect(tasks.isNotEmpty, true);
      expect(tasks.any((t) => t.id == 'tsk-001'), true);

      final detail = await service.getTaskDetail('tsk-001');
      expect(detail, isNotNull);
      expect(detail!.title, 'Persiapan Display Sofa L-Shape');

      final newComment = await service.addComment(
        'tsk-001',
        'Unit sofa sudah ditempatkan di bay 1',
      );
      expect(newComment.message, 'Unit sofa sudah ditempatkan di bay 1');

      final updatedDetail = await service.getTaskDetail('tsk-001');
      expect(updatedDetail!.comments.any((c) => c.message.contains('bay 1')), true);

      final completedTask = await service.updateStatus(
        'tsk-001',
        'COMPLETED',
        completionNotes: 'Pekerjaan selesai 100%',
      );
      expect(completedTask.status, 'COMPLETED');
      expect(completedTask.completionNotes, 'Pekerjaan selesai 100%');
    });
  });

  group('OperationalTaskDetailScreen Widget Tests', () {
    Widget createWidgetUnderTest(String taskId) {
      final mockService = MockOperationalTaskService();
      return ProviderScope(
        overrides: [
          operationalTaskServiceProvider.overrideWithValue(mockService),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          locale: const Locale('id'),
          home: OperationalTaskDetailScreen(taskId: taskId),
        ),
      );
    }

    testWidgets('renders task details, metadata chips, and comments feed',
        (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest('tsk-001'));
      await tester.pumpAndSettle();

      expect(find.text('TSK-202611-1001'), findsOneWidget);
      expect(find.text('Persiapan Display Sofa L-Shape'), findsOneWidget);
      expect(find.text('Display Showroom'), findsOneWidget);
      expect(find.text('HIGH'), findsOneWidget);
      expect(find.text('PENDING'), findsOneWidget);
      expect(find.textContaining('Supervisor Budi'), findsWidgets);
      expect(find.textContaining('lorong jalan'), findsOneWidget);
    });

    testWidgets('allows worker to submit new collaboration comment',
        (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest('tsk-001'));
      await tester.pumpAndSettle();

      final inputFinder = find.byType(TextField);
      expect(inputFinder, findsOneWidget);

      await tester.enterText(inputFinder, 'Sedang memindahkan sofa ke showroom');
      await tester.pump();

      final sendFinder = find.byIcon(Icons.send);
      expect(sendFinder, findsOneWidget);

      await tester.tap(sendFinder);
      await tester.pumpAndSettle();

      expect(find.text('Sedang memindahkan sofa ke showroom'), findsOneWidget);
    });

    testWidgets('allows marking task as completed with completion notes dialog',
        (WidgetTester tester) async {
      await tester.pumpWidget(createWidgetUnderTest('tsk-001'));
      await tester.pumpAndSettle();

      final completeBtn = find.text('Tandai Selesai');
      expect(completeBtn, findsOneWidget);

      await tester.tap(completeBtn);
      await tester.pumpAndSettle();

      expect(find.text('Konfirmasi Selesai'), findsOneWidget);

      final notesInput = find.byType(TextField).last;
      await tester.enterText(notesInput, 'Selesai dipasang rapi');
      await tester.pump();

      await tester.tap(find.text('Konfirmasi Selesai'));
      await tester.pumpAndSettle();

      expect(find.text('COMPLETED'), findsOneWidget);
      expect(find.text('Selesai dipasang rapi'), findsOneWidget);
    });
  });
}
