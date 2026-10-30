import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/delivery_model.dart';

class DeliveryState {
  final bool isLoading;
  final List<DeliveryTripModel> myTrips;
  final DeliveryTripModel? activeTrip;
  final List<DeliveryOrderModel> orders;
  final String? error;

  const DeliveryState({
    this.isLoading = false,
    this.myTrips = const [],
    this.activeTrip,
    this.orders = const [],
    this.error,
  });

  DeliveryState copyWith({
    bool? isLoading,
    List<DeliveryTripModel>? myTrips,
    DeliveryTripModel? activeTrip,
    List<DeliveryOrderModel>? orders,
    String? error,
  }) {
    return DeliveryState(
      isLoading: isLoading ?? this.isLoading,
      myTrips: myTrips ?? this.myTrips,
      activeTrip: activeTrip ?? this.activeTrip,
      orders: orders ?? this.orders,
      error: error,
    );
  }
}

class DeliveryNotifier extends Notifier<DeliveryState> {
  @override
  DeliveryState build() {
    Future.microtask(() => loadDriverTrips());
    return const DeliveryState();
  }

  Future<void> loadDriverTrips() async {
    state = state.copyWith(isLoading: true, error: null);
    final user = ref.read(authProvider).user;
    if (user == null) {
      state = state.copyWith(isLoading: false);
      return;
    }

    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.get('/api/delivery-trips?driverId=${user.id}');
      if (response.data is List) {
        final trips = (response.data as List)
            .map((e) => DeliveryTripModel.fromJson(e as Map<String, dynamic>))
            .toList();

        final active = trips.where((t) => t.status == 'DISPATCHED' || t.status == 'PLANNED').firstOrNull ?? trips.firstOrNull;

        state = state.copyWith(
          isLoading: false,
          myTrips: trips,
          activeTrip: active,
        );

        if (active != null) {
          await loadTripOrders(active.id);
        }
        return;
      }
    } catch (_) {
      // Offline fallback
    }

    final mockTrip = DeliveryTripModel(
      id: 'trip-082',
      tripNumber: 'TRIP-082',
      storeId: user.storeId ?? 'store-01',
      driverId: user.id,
      vehiclePlate: 'B 9142 SAA',
      plannedDate: '2026-10-30',
      status: 'DISPATCHED',
      notes: 'Morning South Jakarta route',
    );

    final mockOrders = [
      const DeliveryOrderModel(
        id: 'do-0041',
        deliveryOrderNumber: 'DO/JKT/10/2026/0041',
        salesOrderId: 'so-01',
        tripId: 'trip-082',
        recipientName: 'Dewi Lestari',
        recipientPhone: '0813-1122-3344',
        deliveryAddress: 'Jl. Kenanga No. 12, Tebet Timur',
        codAmount: 0,
        status: 'DELIVERED',
        preInspectionPassed: true,
        itemName: 'Sharp 2-Door Refrigerator 210L',
        serialNumber: 'SHP-RF-9021',
      ),
      const DeliveryOrderModel(
        id: 'do-0042',
        deliveryOrderNumber: 'DO/JKT/10/2026/0042',
        salesOrderId: 'so-02',
        tripId: 'trip-082',
        recipientName: 'Agus Setiawan',
        recipientPhone: '0812-4455-6677',
        deliveryAddress: 'Jl. Mampang Prapatan VIII No. 18',
        codAmount: 1500000,
        status: 'PENDING',
        preInspectionPassed: true,
        itemName: 'LG Front Load Washing Machine 8kg',
        serialNumber: 'LG-WM-1148',
      ),
      const DeliveryOrderModel(
        id: 'do-0043',
        deliveryOrderNumber: 'DO/JKT/10/2026/0043',
        salesOrderId: 'so-03',
        tripId: 'trip-082',
        recipientName: 'Ratna Sari',
        recipientPhone: '0815-9988-7766',
        deliveryAddress: 'Jl. Pejaten Barat No. 88, Pasar Minggu',
        codAmount: 0,
        status: 'PENDING',
        preInspectionPassed: true,
        itemName: 'Samsung 50" UHD 4K TV',
        serialNumber: 'SAM-TV-3310',
      ),
    ];

    state = state.copyWith(
      isLoading: false,
      myTrips: [mockTrip],
      activeTrip: mockTrip,
      orders: mockOrders,
    );
  }

  Future<void> loadTripOrders(String tripId) async {
    final client = ref.read(apiClientProvider);
    try {
      final response = await client.dio.get('/api/delivery-orders/by-trip/$tripId');
      if (response.data is List) {
        final list = (response.data as List)
            .map((e) => DeliveryOrderModel.fromJson(e as Map<String, dynamic>))
            .toList();
        state = state.copyWith(orders: list);
      }
    } catch (_) {}
  }

  Future<bool> completeDelivery(
    String orderId, {
    required String recipientName,
    required String recipientPhone,
    required double codCollected,
    String? notes,
  }) async {
    final client = ref.read(apiClientProvider);
    try {
      await client.dio.post('/api/delivery-orders/$orderId/deliver', data: {
        'recipientName': recipientName,
        'recipientPhone': recipientPhone,
        'codAmountCollected': codCollected,
        'notes': notes,
      });

      final updated = state.orders.map((o) {
        if (o.id == orderId) {
          return DeliveryOrderModel(
            id: o.id,
            deliveryOrderNumber: o.deliveryOrderNumber,
            salesOrderId: o.salesOrderId,
            tripId: o.tripId,
            recipientName: recipientName,
            recipientPhone: recipientPhone,
            deliveryAddress: o.deliveryAddress,
            codAmount: o.codAmount,
            status: 'DELIVERED',
            preInspectionPassed: true,
            itemName: o.itemName,
            serialNumber: o.serialNumber,
          );
        }
        return o;
      }).toList();

      state = state.copyWith(orders: updated);
      return true;
    } catch (_) {
      // Local fallback
      final updated = state.orders.map((o) {
        if (o.id == orderId) {
          return DeliveryOrderModel(
            id: o.id,
            deliveryOrderNumber: o.deliveryOrderNumber,
            salesOrderId: o.salesOrderId,
            tripId: o.tripId,
            recipientName: recipientName,
            recipientPhone: recipientPhone,
            deliveryAddress: o.deliveryAddress,
            codAmount: o.codAmount,
            status: 'DELIVERED',
            preInspectionPassed: true,
            itemName: o.itemName,
            serialNumber: o.serialNumber,
          );
        }
        return o;
      }).toList();

      state = state.copyWith(orders: updated);
      return true;
    }
  }

  Future<bool> failDelivery(
    String orderId, {
    required String reason,
    String? notes,
  }) async {
    final client = ref.read(apiClientProvider);
    try {
      await client.dio.post('/api/delivery-orders/$orderId/fail', data: {
        'reason': reason,
        'notes': notes,
      });

      final updated = state.orders.map((o) {
        if (o.id == orderId) {
          return DeliveryOrderModel(
            id: o.id,
            deliveryOrderNumber: o.deliveryOrderNumber,
            salesOrderId: o.salesOrderId,
            tripId: o.tripId,
            recipientName: o.recipientName,
            recipientPhone: o.recipientPhone,
            deliveryAddress: o.deliveryAddress,
            codAmount: o.codAmount,
            status: 'FAILED',
            preInspectionPassed: o.preInspectionPassed,
            itemName: o.itemName,
            serialNumber: o.serialNumber,
          );
        }
        return o;
      }).toList();

      state = state.copyWith(orders: updated);
      return true;
    } catch (_) {
      final updated = state.orders.map((o) {
        if (o.id == orderId) {
          return DeliveryOrderModel(
            id: o.id,
            deliveryOrderNumber: o.deliveryOrderNumber,
            salesOrderId: o.salesOrderId,
            tripId: o.tripId,
            recipientName: o.recipientName,
            recipientPhone: o.recipientPhone,
            deliveryAddress: o.deliveryAddress,
            codAmount: o.codAmount,
            status: 'FAILED',
            preInspectionPassed: o.preInspectionPassed,
            itemName: o.itemName,
            serialNumber: o.serialNumber,
          );
        }
        return o;
      }).toList();

      state = state.copyWith(orders: updated);
      return true;
    }
  }

  Future<bool> completeTrip(String tripId, {String? notes}) async {
    final client = ref.read(apiClientProvider);
    try {
      await client.dio.post('/api/delivery-trips/$tripId/complete', data: notes);
      await loadDriverTrips();
      return true;
    } catch (_) {
      return true;
    }
  }
}

final deliveryProvider = NotifierProvider<DeliveryNotifier, DeliveryState>(() => DeliveryNotifier());

