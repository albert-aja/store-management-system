import 'dart:math' as math;
import 'package:geolocator/geolocator.dart';
import '../localization/worker_message.dart';

class GeoCoordinates {
  final double latitude;
  final double longitude;
  final double accuracyMeters;
  final DateTime? timestamp;

  const GeoCoordinates({
    required this.latitude,
    required this.longitude,
    this.accuracyMeters = 5.0,
    required this.timestamp,
  });

  @override
  String toString() =>
      '$latitude, $longitude (±${accuracyMeters.toStringAsFixed(1)}m)';

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'accuracyMeters': accuracyMeters,
      'timestamp': timestamp?.toIso8601String(),
    };
  }
}

class GeoLocationService {
  // Pusat Jaya Store reference location (Jakarta Pusat)
  static const GeoCoordinates defaultStoreLocation = GeoCoordinates(
    latitude: -6.1824,
    longitude: 106.8285,
    accuracyMeters: 3.0,
    timestamp: null,
  );

  /// Calculate great-circle distance between two GPS coordinates using the Haversine formula in meters.
  static double calculateDistanceMeters(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double earthRadiusMeters = 6371000.0;
    final dLat = _degreesToRadians(lat2 - lat1);
    final dLon = _degreesToRadians(lon2 - lon1);

    final a =
        math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_degreesToRadians(lat1)) *
            math.cos(_degreesToRadians(lat2)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);

    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  static double _degreesToRadians(double degrees) {
    return degrees * (math.pi / 180.0);
  }

  /// Verifies if worker's current coordinates fall within store geofence radius (e.g. 200m).
  static bool verifyStoreGeofence({
    required GeoCoordinates workerLocation,
    double storeLat = -6.1824,
    double storeLon = 106.8285,
    double allowedRadiusMeters = 200.0,
  }) {
    final distance = calculateDistanceMeters(
      workerLocation.latitude,
      workerLocation.longitude,
      storeLat,
      storeLon,
    );
    return distance <= allowedRadiusMeters;
  }

  static Future<GeoCoordinates> getCurrentLocation({
    bool simulateAtStore = true,
  }) async {
    if (simulateAtStore) {
      await Future.delayed(const Duration(milliseconds: 300));
      return GeoCoordinates(
        latitude: -6.1824 + (math.Random().nextDouble() * 0.0001),
        longitude: 106.8285 + (math.Random().nextDouble() * 0.0001),
        accuracyMeters: 4.2,
        timestamp: DateTime.now(),
      );
    }

    if (!await Geolocator.isLocationServiceEnabled()) {
      throw WorkerMessage((l10n) => l10n.gpsEnable);
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      throw WorkerMessage((l10n) => l10n.gpsDenied);
    }
    if (permission == LocationPermission.deniedForever) {
      throw WorkerMessage((l10n) => l10n.gpsBlocked);
    }

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
    return GeoCoordinates(
      latitude: position.latitude,
      longitude: position.longitude,
      accuracyMeters: position.accuracy,
      timestamp: position.timestamp,
    );
  }
}
