import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/delivery_model.dart';
import '../../../core/localization/worker_message.dart';

class DeliveryState {
  final bool isLoading;
  final List<DeliveryTripModel> myTrips;
  final DeliveryTripModel? activeTrip;
  final List<DeliveryOrderModel> orders;
  final Object? error;

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
    Object? error,
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
  int _loadGeneration = 0;

  @override
  DeliveryState build() {
    Future.microtask(() => loadDriverTrips());
    return const DeliveryState();
  }

  Future<void> loadDriverTrips({String? tripId}) async {
    final requestedTripId = tripId != null && tripId.isNotEmpty ? tripId : null;
    final generation = ++_loadGeneration;
    state = state.copyWith(isLoading: true, error: null);
    final user = ref.read(authProvider).user;
    if (user == null) {
      state = DeliveryState(
        error: WorkerMessage((l10n) => l10n.deliverySignIn),
      );
      return;
    }

    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.get(
        '/api/delivery-trips?driverId=${user.id}',
      );
      if (response.data is! List) {
        throw const FormatException('Invalid delivery trip response.');
      }
      final trips = (response.data as List)
          .map((e) => DeliveryTripModel.fromJson(e as Map<String, dynamic>))
          .toList();

      if (generation != _loadGeneration) return;
      final active = requestedTripId != null
          ? trips.where((t) => t.id == requestedTripId).firstOrNull
          : trips
                    .where(
                      (t) => t.status == 'DISPATCHED' || t.status == 'PLANNED',
                    )
                    .firstOrNull ??
                trips.firstOrNull;

      if (requestedTripId != null && active == null) {
        state = DeliveryState(
          myTrips: trips,
          error: WorkerMessage((l10n) => l10n.deliveryNotAssigned),
        );
        return;
      }
      state = DeliveryState(
        isLoading: active != null,
        myTrips: trips,
        activeTrip: active,
      );
      if (active != null) {
        await loadTripOrders(active.id, generation: generation);
      }
    } on DioException {
      if (generation != _loadGeneration) return;
      state = DeliveryState(
        error: WorkerMessage((l10n) => l10n.deliveryTripsFailed),
      );
    } on FormatException {
      if (generation != _loadGeneration) return;
      state = DeliveryState(
        error: WorkerMessage((l10n) => l10n.deliveryTripInvalid),
      );
    }
  }

  Future<void> loadTripOrders(String tripId, {int? generation}) async {
    final client = ref.read(apiClientProvider);
    try {
      final response = await client.dio.get(
        '/api/delivery-orders/by-trip/$tripId',
      );
      if (response.data is! List) {
        throw const FormatException('Invalid delivery stop response.');
      }
      if (generation == null || generation == _loadGeneration) {
        final list = (response.data as List)
            .map((e) => DeliveryOrderModel.fromJson(e as Map<String, dynamic>))
            .toList();
        state = state.copyWith(orders: list, isLoading: false);
      }
    } on DioException {
      if (generation != null && generation != _loadGeneration) return;
      state = state.copyWith(
        orders: [],
        isLoading: false,
        error: WorkerMessage((l10n) => l10n.deliveryStopsFailed),
      );
    } on FormatException {
      if (generation != null && generation != _loadGeneration) return;
      state = state.copyWith(
        orders: [],
        isLoading: false,
        error: WorkerMessage((l10n) => l10n.deliveryStopInvalid),
      );
    }
  }

  Future<bool> completeDelivery(
    String orderId, {
    required String recipientName,
    required String recipientPhone,
    required double codCollected,
    String? notes,
    String? proofPhotoUrl,
  }) async {
    final client = ref.read(apiClientProvider);
    try {
      await client.dio.post(
        '/api/delivery-orders/$orderId/deliver',
        data: {
          'recipientName': recipientName,
          'recipientPhone': recipientPhone,
          'codAmountCollected': codCollected,
          'notes': notes,
        },
      );

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
            manifestSerials: o.manifestSerials,
            destinationLatitude: o.destinationLatitude,
            destinationLongitude: o.destinationLongitude,
            deliveryWindow: o.deliveryWindow,
          );
        }
        return o;
      }).toList();

      state = state.copyWith(orders: updated);
      return true;
    } catch (error) {
      state = state.copyWith(error: error.toString());
      return false;
    }
  }

  Future<bool> failDelivery(
    String orderId, {
    required String reason,
    String? notes,
    String? proofPhotoUrl,
  }) async {
    final client = ref.read(apiClientProvider);
    try {
      await client.dio.post(
        '/api/delivery-orders/$orderId/fail',
        data: {
          'failureReason': reason,
          'notes': notes,
          if (proofPhotoUrl != null && proofPhotoUrl.isNotEmpty)
            'proofPhotoUrl': proofPhotoUrl,
        },
      );

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
            manifestSerials: o.manifestSerials,
            destinationLatitude: o.destinationLatitude,
            destinationLongitude: o.destinationLongitude,
            deliveryWindow: o.deliveryWindow,
          );
        }
        return o;
      }).toList();

      state = state.copyWith(orders: updated);
      return true;
    } catch (error) {
      state = state.copyWith(error: error.toString());
      return false;
    }
  }

  Future<bool> completeTrip(String tripId, {String? notes}) async {
    final client = ref.read(apiClientProvider);
    try {
      await client.dio.post(
        '/api/delivery-trips/$tripId/complete',
        data: notes,
      );
      await loadDriverTrips();
      return true;
    } catch (_) {
      return true;
    }
  }
}

final deliveryProvider = NotifierProvider<DeliveryNotifier, DeliveryState>(
  () => DeliveryNotifier(),
);
