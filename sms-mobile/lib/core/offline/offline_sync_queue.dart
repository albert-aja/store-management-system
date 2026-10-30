import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';
import '../../features/auth/providers/auth_provider.dart';

class OfflineActionItem {
  final String id;
  final String actionType;
  final String endpoint;
  final String method;
  final Map<String, dynamic> payload;
  final String createdAt;
  final int retryCount;
  final String status;

  const OfflineActionItem({
    required this.id,
    required this.actionType,
    required this.endpoint,
    required this.method,
    required this.payload,
    required this.createdAt,
    this.retryCount = 0,
    this.status = 'PENDING',
  });

  factory OfflineActionItem.fromJson(Map<String, dynamic> json) {
    return OfflineActionItem(
      id: json['id'] as String,
      actionType: json['actionType'] as String,
      endpoint: json['endpoint'] as String,
      method: json['method'] as String? ?? 'POST',
      payload: (json['payload'] as Map<String, dynamic>?) ?? {},
      createdAt: json['createdAt'] as String,
      retryCount: json['retryCount'] as int? ?? 0,
      status: json['status'] as String? ?? 'PENDING',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'actionType': actionType,
      'endpoint': endpoint,
      'method': method,
      'payload': payload,
      'createdAt': createdAt,
      'retryCount': retryCount,
      'status': status,
    };
  }

  OfflineActionItem copyWith({
    int? retryCount,
    String? status,
  }) {
    return OfflineActionItem(
      id: id,
      actionType: actionType,
      endpoint: endpoint,
      method: method,
      payload: payload,
      createdAt: createdAt,
      retryCount: retryCount ?? this.retryCount,
      status: status ?? this.status,
    );
  }
}

class OfflineSyncState {
  final bool isSyncing;
  final List<OfflineActionItem> queue;
  final String? lastSyncTime;
  final String? syncError;

  const OfflineSyncState({
    this.isSyncing = false,
    this.queue = const [],
    this.lastSyncTime,
    this.syncError,
  });

  int get pendingCount => queue.where((i) => i.status == 'PENDING').length;
  bool get hasPending => pendingCount > 0;

  OfflineSyncState copyWith({
    bool? isSyncing,
    List<OfflineActionItem>? queue,
    String? lastSyncTime,
    String? syncError,
  }) {
    return OfflineSyncState(
      isSyncing: isSyncing ?? this.isSyncing,
      queue: queue ?? this.queue,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      syncError: syncError,
    );
  }
}

class OfflineSyncQueueNotifier extends Notifier<OfflineSyncState> {
  static const String _storageKey = 'sms_offline_sync_queue';

  @override
  OfflineSyncState build() {
    Future.microtask(() => _loadQueue());
    return const OfflineSyncState();
  }

  Future<void> _loadQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonListStr = prefs.getString(_storageKey);
      if (jsonListStr != null) {
        final list = (jsonDecode(jsonListStr) as List)
            .map((e) => OfflineActionItem.fromJson(e as Map<String, dynamic>))
            .toList();
        state = state.copyWith(queue: list);
      }
    } catch (_) {}
  }

  Future<void> _persistQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = state.queue.map((e) => e.toJson()).toList();
      await prefs.setString(_storageKey, jsonEncode(jsonList));
    } catch (_) {}
  }

  /// Enqueue an action to be dispatched immediately or replayed later when connection is restored.
  Future<void> enqueueAction({
    required String actionType,
    required String endpoint,
    String method = 'POST',
    required Map<String, dynamic> payload,
  }) async {
    final item = OfflineActionItem(
      id: 'queue-${DateTime.now().millisecondsSinceEpoch}',
      actionType: actionType,
      endpoint: endpoint,
      method: method,
      payload: payload,
      createdAt: DateTime.now().toIso8601String(),
    );

    state = state.copyWith(queue: [...state.queue, item]);
    await _persistQueue();

    // Attempt instant background sync if online
    syncAll();
  }

  /// Replay all pending offline items to the backend REST API
  Future<int> syncAll() async {
    if (state.isSyncing || state.queue.isEmpty) return 0;

    state = state.copyWith(isSyncing: true, syncError: null);
    final client = ref.read(apiClientProvider);

    int successCount = 0;
    final List<OfflineActionItem> remainingQueue = [];

    for (final item in state.queue) {
      try {
        if (item.method == 'PUT') {
          await client.dio.put(item.endpoint, data: item.payload);
        } else {
          await client.dio.post(item.endpoint, data: item.payload);
        }
        successCount++;
      } catch (e) {
        // Increment retry or keep pending
        remainingQueue.add(item.copyWith(
          retryCount: item.retryCount + 1,
          status: 'PENDING',
        ));
      }
    }

    state = state.copyWith(
      isSyncing: false,
      queue: remainingQueue,
      lastSyncTime: DateTime.now().toIso8601String(),
    );

    await _persistQueue();
    return successCount;
  }

  Future<void> clearQueue() async {
    state = state.copyWith(queue: []);
    await _persistQueue();
  }
}

final offlineSyncProvider =
    NotifierProvider<OfflineSyncQueueNotifier, OfflineSyncState>(() => OfflineSyncQueueNotifier());

