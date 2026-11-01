import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/operational_task_model.dart';
import '../services/operational_task_service.dart';

class OperationalTaskListState {
  final bool isLoading;
  final List<OperationalTaskModel> tasks;
  final String? error;

  const OperationalTaskListState({
    this.isLoading = false,
    this.tasks = const [],
    this.error,
  });

  OperationalTaskListState copyWith({
    bool? isLoading,
    List<OperationalTaskModel>? tasks,
    String? error,
  }) {
    return OperationalTaskListState(
      isLoading: isLoading ?? this.isLoading,
      tasks: tasks ?? this.tasks,
      error: error,
    );
  }
}

class OperationalTaskListNotifier extends Notifier<OperationalTaskListState> {
  @override
  OperationalTaskListState build() {
    Future.microtask(() => loadTasks());
    return const OperationalTaskListState();
  }

  Future<void> loadTasks({String? status, String? priority, String? category}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final service = ref.read(operationalTaskServiceProvider);
      final list = await service.fetchTasks(
        status: status,
        priority: priority,
        category: category,
      );
      state = state.copyWith(isLoading: false, tasks: list);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> updateStatus(String taskId, String status, {String? notes}) async {
    try {
      final service = ref.read(operationalTaskServiceProvider);
      final updated = await service.updateStatus(taskId, status, completionNotes: notes);
      final updatedList = state.tasks.map((t) => t.id == taskId ? updated : t).toList();
      state = state.copyWith(tasks: updatedList);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> addComment(String taskId, String message) async {
    try {
      final service = ref.read(operationalTaskServiceProvider);
      final newComment = await service.addComment(taskId, message);
      final updatedList = state.tasks.map((t) {
        if (t.id == taskId) {
          return t.copyWith(
            comments: [...t.comments, newComment],
            commentCount: t.commentCount + 1,
          );
        }
        return t;
      }).toList();
      state = state.copyWith(tasks: updatedList);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

final operationalTaskListProvider =
    NotifierProvider<OperationalTaskListNotifier, OperationalTaskListState>(() => OperationalTaskListNotifier());
