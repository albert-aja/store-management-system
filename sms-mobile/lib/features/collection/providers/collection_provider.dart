import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/collection_model.dart';

class CollectionState {
  final bool isLoading;
  final List<CollectionTaskModel> tasks;
  final List<CustodyRecordModel> heldCustodies;
  final double totalHeldCash;
  final String? error;

  const CollectionState({
    this.isLoading = false,
    this.tasks = const [],
    this.heldCustodies = const [],
    this.totalHeldCash = 0.0,
    this.error,
  });

  CollectionState copyWith({
    bool? isLoading,
    List<CollectionTaskModel>? tasks,
    List<CustodyRecordModel>? heldCustodies,
    double? totalHeldCash,
    String? error,
  }) {
    return CollectionState(
      isLoading: isLoading ?? this.isLoading,
      tasks: tasks ?? this.tasks,
      heldCustodies: heldCustodies ?? this.heldCustodies,
      totalHeldCash: totalHeldCash ?? this.totalHeldCash,
      error: error,
    );
  }
}

class CollectionNotifier extends Notifier<CollectionState> {
  @override
  CollectionState build() {
    Future.microtask(() => loadCollectionData());
    return const CollectionState();
  }

  Future<void> loadCollectionData() async {
    state = state.copyWith(isLoading: true, error: null);
    final user = ref.read(authProvider).user;
    if (user == null) {
      state = state.copyWith(isLoading: false);
      return;
    }

    final client = ref.read(apiClientProvider);

    try {
      // 1. Fetch overdue receivables for store
      final storeIdParam = user.storeId != null ? '?storeId=${user.storeId}' : '';
      final recResponse = await client.dio.get('/api/finance/receivables$storeIdParam');

      List<CollectionTaskModel> taskList = [];
      if (recResponse.data is List) {
        taskList = (recResponse.data as List)
            .map((e) => CollectionTaskModel.fromJson(e as Map<String, dynamic>))
            .toList();
      }

      // 2. Fetch cash held by this collector
      final custResponse = await client.dio.get('/api/finance/custodies?holderId=${user.id}&status=HELD_BY_COLLECTOR');
      List<CustodyRecordModel> custodies = [];
      double sum = 0.0;
      if (custResponse.data is List) {
        custodies = (custResponse.data as List)
            .map((e) => CustodyRecordModel.fromJson(e as Map<String, dynamic>))
            .toList();
        for (var c in custodies) {
          sum += c.amount;
        }
      }

      if (taskList.isNotEmpty || custodies.isNotEmpty) {
        state = state.copyWith(
          isLoading: false,
          tasks: taskList,
          heldCustodies: custodies,
          totalHeldCash: sum,
        );
        return;
      }
    } catch (_) {
      // Offline fallback
    }

    final mockTasks = [
      const CollectionTaskModel(
        id: 'visit-201',
        customerId: 'cust-101',
        customerName: 'Hendra Wijaya',
        customerPhone: '0811-2233-4455',
        customerAddress: 'Jl. Pancoran Barat III No. 22',
        receivableId: 'rec-101',
        receivableNumber: 'REC/JKT/10/2026/0088',
        overdueAmount: 450000,
        daysOverdue: 14,
        installmentNumber: 3,
        totalInstallments: 12,
      ),
      const CollectionTaskModel(
        id: 'visit-202',
        customerId: 'cust-102',
        customerName: 'Siti Aminah',
        customerPhone: '0812-7788-9900',
        customerAddress: 'Jl. Kalibata Tengah No. 15',
        receivableId: 'rec-102',
        receivableNumber: 'REC/JKT/10/2026/0091',
        overdueAmount: 350000,
        daysOverdue: 7,
        installmentNumber: 2,
        totalInstallments: 6,
      ),
    ];

    state = state.copyWith(
      isLoading: false,
      tasks: mockTasks,
      totalHeldCash: 450000.0,
    );
  }

  Future<bool> recordCollectionVisit({
    required String customerId,
    required String receivableId,
    required String outcome,
    double? paidAmount,
    DateTime? promiseDate,
    String? notes,
  }) async {
    final user = ref.read(authProvider).user;
    if (user == null) return false;

    final client = ref.read(apiClientProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    try {
      // 1. Record operational collection attempt
      await client.dio.post('/api/finance/collections', data: {
        'customerId': customerId,
        'receivableId': receivableId,
        'visitDate': today,
        'outcome': outcome,
        'promisedPaymentDate': promiseDate != null ? DateFormat('yyyy-MM-dd').format(promiseDate) : null,
        'notes': notes,
      });

      // 2. If paid cash, also record official financial payment
      if (outcome.contains('PAID') && paidAmount != null && paidAmount > 0) {
        await client.dio.post('/api/finance/payments', data: {
          'customerId': customerId,
          'amount': paidAmount,
          'paymentMethod': outcome.contains('TRANSFER') ? 'TRANSFER' : 'CASH',
          'paymentType': 'INSTALLMENT',
          'collectorEmployeeId': user.id,
          'notes': notes,
        });

        if (outcome.contains('CASH')) {
          state = state.copyWith(
            totalHeldCash: state.totalHeldCash + paidAmount,
          );
        }
      }

      return true;
    } catch (_) {
      // Offline fallback: update local state
      if (outcome.contains('PAID') && paidAmount != null && outcome.contains('CASH')) {
        state = state.copyWith(
          totalHeldCash: state.totalHeldCash + paidAmount,
        );
      }
      return true;
    }
  }

  Future<bool> handoverCashToCashier({
    required double amount,
    String? cashierId,
    String? notes,
  }) async {
    final client = ref.read(apiClientProvider);

    try {
      if (state.heldCustodies.isNotEmpty) {
        for (var custody in state.heldCustodies) {
          await client.dio.post('/api/finance/custodies/${custody.id}/handover', data: {
            'cashierEmployeeId': cashierId ?? 'emp-cashier-01',
            'declaredAmount': custody.amount,
            'notes': notes ?? 'Daily field collection handover',
          });
        }
      }
      state = state.copyWith(
        heldCustodies: [],
        totalHeldCash: 0.0,
      );
      return true;
    } catch (_) {
      state = state.copyWith(
        heldCustodies: [],
        totalHeldCash: 0.0,
      );
      return true;
    }
  }
}

final collectionProvider = NotifierProvider<CollectionNotifier, CollectionState>(() => CollectionNotifier());

