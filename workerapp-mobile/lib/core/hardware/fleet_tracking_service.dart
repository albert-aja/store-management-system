import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../offline/offline_sync_queue.dart';
import '../localization/worker_message.dart';

enum TrackingSessionState {
  notStarted,
  active,
  pausedBreak,
  pausedManual,
  interrupted,
  completed,
}

/// [Q.18] Operational destination target monitored by Dynamic Geofencing engine.
class GeofenceTarget {
  final String id;
  final String title;
  final String address;
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final bool isTriggered;
  final DateTime? triggeredAt;

  const GeofenceTarget({
    required this.id,
    required this.title,
    required this.address,
    required this.latitude,
    required this.longitude,
    this.radiusMeters = 300.0,
    this.isTriggered = false,
    this.triggeredAt,
  });

  GeofenceTarget copyWith({
    String? id,
    String? title,
    String? address,
    double? latitude,
    double? longitude,
    double? radiusMeters,
    bool? isTriggered,
    DateTime? triggeredAt,
  }) {
    return GeofenceTarget(
      id: id ?? this.id,
      title: title ?? this.title,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      radiusMeters: radiusMeters ?? this.radiusMeters,
      isTriggered: isTriggered ?? this.isTriggered,
      triggeredAt: triggeredAt ?? this.triggeredAt,
    );
  }
}

/// [Q.18] Active geofence proximity arrival event payload.
class GeofenceProximityAlert {
  final String targetId;
  final String title;
  final String address;
  final double distanceMeters;
  final DateTime triggeredAt;

  const GeofenceProximityAlert({
    required this.targetId,
    required this.title,
    required this.address,
    required this.distanceMeters,
    required this.triggeredAt,
  });
}

class FleetTrackingState {
  final TrackingSessionState sessionState;
  final String? sessionId;
  final String? taskType;
  final String? taskCode;
  final String? vehiclePlate;
  final double? lastLatitude;
  final double? lastLongitude;
  final double? lastSpeedKmh;
  final double? lastAccuracyMeters;
  final int pointsRecordedCount;
  final String? pauseReason;
  final WorkerMessage? pauseExplanation;
  final String? errorMessage;
  final bool isBreakActive;
  final int batteryLevelPct;
  final bool isLowBatteryThrottled;
  final int collectionIntervalSeconds;
  final double batteryTemperatureCelsius;
  final bool isThermalCutoffActive;
  final String? lastNotificationActionTriggered;
  final String ongoingNotificationTitle;
  final String ongoingNotificationBody;
  final List<String> ongoingNotificationActions;
  final List<GeofenceTarget> geofenceTargets;
  final GeofenceProximityAlert? activeProximityAlert;
  final double proximityThresholdMeters;

  const FleetTrackingState({
    this.sessionState = TrackingSessionState.notStarted,
    this.sessionId,
    this.taskType,
    this.taskCode,
    this.vehiclePlate,
    this.lastLatitude,
    this.lastLongitude,
    this.lastSpeedKmh,
    this.lastAccuracyMeters,
    this.pointsRecordedCount = 0,
    this.pauseReason,
    this.pauseExplanation,
    this.errorMessage,
    this.isBreakActive = false,
    this.batteryLevelPct = 85,
    this.isLowBatteryThrottled = false,
    this.collectionIntervalSeconds = 15,
    this.batteryTemperatureCelsius = 32.0,
    this.isThermalCutoffActive = false,
    this.lastNotificationActionTriggered,
    this.ongoingNotificationTitle = 'SMS Field Telematics Active',
    this.ongoingNotificationBody =
        'Tracking bounded to assigned operational task',
    this.ongoingNotificationActions = const ['QUICK_PAUSE'],
    this.geofenceTargets = const [],
    this.activeProximityAlert,
    this.proximityThresholdMeters = 300.0,
  });

  bool get isTracking =>
      sessionState == TrackingSessionState.active ||
      sessionState == TrackingSessionState.pausedBreak ||
      sessionState == TrackingSessionState.pausedManual;

  bool get hasProximityAlert => activeProximityAlert != null;

  FleetTrackingState copyWith({
    TrackingSessionState? sessionState,
    String? sessionId,
    String? taskType,
    String? taskCode,
    String? vehiclePlate,
    double? lastLatitude,
    double? lastLongitude,
    double? lastSpeedKmh,
    double? lastAccuracyMeters,
    int? pointsRecordedCount,
    String? pauseReason,
    WorkerMessage? pauseExplanation,
    bool clearPauseExplanation = false,
    bool clearPauseReason = false,
    String? errorMessage,
    bool? isBreakActive,
    int? batteryLevelPct,
    bool? isLowBatteryThrottled,
    int? collectionIntervalSeconds,
    double? batteryTemperatureCelsius,
    bool? isThermalCutoffActive,
    String? lastNotificationActionTriggered,
    String? ongoingNotificationTitle,
    String? ongoingNotificationBody,
    List<String>? ongoingNotificationActions,
    List<GeofenceTarget>? geofenceTargets,
    GeofenceProximityAlert? activeProximityAlert,
    bool clearProximityAlert = false,
    double? proximityThresholdMeters,
  }) {
    return FleetTrackingState(
      sessionState: sessionState ?? this.sessionState,
      sessionId: sessionId ?? this.sessionId,
      taskType: taskType ?? this.taskType,
      taskCode: taskCode ?? this.taskCode,
      vehiclePlate: vehiclePlate ?? this.vehiclePlate,
      lastLatitude: lastLatitude ?? this.lastLatitude,
      lastLongitude: lastLongitude ?? this.lastLongitude,
      lastSpeedKmh: lastSpeedKmh ?? this.lastSpeedKmh,
      lastAccuracyMeters: lastAccuracyMeters ?? this.lastAccuracyMeters,
      pointsRecordedCount: pointsRecordedCount ?? this.pointsRecordedCount,
      pauseReason: clearPauseReason ? null : (pauseReason ?? this.pauseReason),
      pauseExplanation: clearPauseReason || clearPauseExplanation
          ? null
          : (pauseExplanation ?? this.pauseExplanation),
      errorMessage: errorMessage,
      isBreakActive: isBreakActive ?? this.isBreakActive,
      batteryLevelPct: batteryLevelPct ?? this.batteryLevelPct,
      isLowBatteryThrottled:
          isLowBatteryThrottled ?? this.isLowBatteryThrottled,
      collectionIntervalSeconds:
          collectionIntervalSeconds ?? this.collectionIntervalSeconds,
      batteryTemperatureCelsius:
          batteryTemperatureCelsius ?? this.batteryTemperatureCelsius,
      isThermalCutoffActive:
          isThermalCutoffActive ?? this.isThermalCutoffActive,
      lastNotificationActionTriggered:
          lastNotificationActionTriggered ??
          this.lastNotificationActionTriggered,
      ongoingNotificationTitle:
          ongoingNotificationTitle ?? this.ongoingNotificationTitle,
      ongoingNotificationBody:
          ongoingNotificationBody ?? this.ongoingNotificationBody,
      ongoingNotificationActions:
          ongoingNotificationActions ?? this.ongoingNotificationActions,
      geofenceTargets: geofenceTargets ?? this.geofenceTargets,
      activeProximityAlert: clearProximityAlert
          ? null
          : (activeProximityAlert ?? this.activeProximityAlert),
      proximityThresholdMeters:
          proximityThresholdMeters ?? this.proximityThresholdMeters,
    );
  }
}

class FleetTrackingNotifier extends Notifier<FleetTrackingState> {
  Timer? _locationTimer;
  Timer? _breakCheckTimer;

  static const int normalIntervalSeconds = 15;
  static const int throttledIntervalSeconds = 60;
  static const int lowBatteryThreshold = 15;
  static const double maxSafeBatteryTemperatureCelsius = 45.0;
  static const double safeRecoveryTemperatureCelsius = 40.0;
  static const double defaultGeofenceRadiusMeters = 300.0;

  // Break window configuration (Default: 12:00 - 13:00 Lunch Break)
  int breakStartHour = 12;
  int breakStartMinute = 0;
  int breakEndHour = 13;
  int breakEndMinute = 0;

  @override
  FleetTrackingState build() {
    ref.onDispose(() {
      _stopTimers();
    });
    return const FleetTrackingState();
  }

  void _stopTimers() {
    _locationTimer?.cancel();
    _locationTimer = null;
    _breakCheckTimer?.cancel();
    _breakCheckTimer = null;
  }

  void _restartLocationTimer(int intervalSeconds) {
    _locationTimer?.cancel();
    if (state.isTracking && !state.isThermalCutoffActive) {
      _locationTimer = Timer.periodic(Duration(seconds: intervalSeconds), (_) {
        _collectAndSendLocation();
      });
    }
  }

  /// [Q.18] Register operational destination geofence targets for active task.
  void setGeofenceTargets(List<GeofenceTarget> targets) {
    state = state.copyWith(geofenceTargets: targets);
    if (state.lastLatitude != null && state.lastLongitude != null) {
      _evaluateGeofences(state.lastLatitude!, state.lastLongitude!);
    }
  }

  /// [Q.18] Add single destination geofence target.
  void addGeofenceTarget(GeofenceTarget target) {
    final updated = List<GeofenceTarget>.from(state.geofenceTargets)
      ..add(target);
    state = state.copyWith(geofenceTargets: updated);
    if (state.lastLatitude != null && state.lastLongitude != null) {
      _evaluateGeofences(state.lastLatitude!, state.lastLongitude!);
    }
  }

  /// [Q.18] Dismiss active proximity banner while preserving triggered state on target.
  void dismissProximityAlert() {
    state = state.copyWith(clearProximityAlert: true);
  }

  /// [Q.18] Clear all geofence targets.
  void clearGeofenceTargets() {
    state = state.copyWith(
      geofenceTargets: const [],
      clearProximityAlert: true,
    );
  }

  /// [Q.18] Evaluate distance from current GPS position to destination targets.
  /// If distance <= 300.0m (defaultGeofenceRadiusMeters) and not previously alerted,
  /// triggers arrival proximity notification and logs session event.
  void _evaluateGeofences(double currentLat, double currentLng) {
    if (state.geofenceTargets.isEmpty) return;

    final updatedTargets = <GeofenceTarget>[];
    GeofenceProximityAlert? newlyTriggeredAlert;

    for (final target in state.geofenceTargets) {
      if (target.isTriggered) {
        updatedTargets.add(target);
        continue;
      }

      final distanceMeters = Geolocator.distanceBetween(
        currentLat,
        currentLng,
        target.latitude,
        target.longitude,
      );

      if (distanceMeters <= target.radiusMeters) {
        final now = DateTime.now();
        final triggeredTarget = target.copyWith(
          isTriggered: true,
          triggeredAt: now,
        );
        updatedTargets.add(triggeredTarget);

        newlyTriggeredAlert = GeofenceProximityAlert(
          targetId: target.id,
          title: target.title,
          address: target.address,
          distanceMeters: distanceMeters,
          triggeredAt: now,
        );

        _recordSessionEvent(
          'GEOFENCE_PROXIMITY_ENTERED',
          'Arrived within ${distanceMeters.toStringAsFixed(0)}m of destination ${target.id} (${target.title} - ${target.address}). Dynamic geofence proximity alert triggered.',
        );
      } else {
        updatedTargets.add(target);
      }
    }

    if (newlyTriggeredAlert != null) {
      final isPaused = state.sessionState == TrackingSessionState.pausedManual;
      final inBreak = state.sessionState == TrackingSessionState.pausedBreak;

      state = state.copyWith(
        geofenceTargets: updatedTargets,
        activeProximityAlert: newlyTriggeredAlert,
        ongoingNotificationTitle:
            '🎯 SMS Proximity Alert (Within ${newlyTriggeredAlert.distanceMeters.toStringAsFixed(0)}m)',
        ongoingNotificationBody:
            'Approaching ${newlyTriggeredAlert.title}: ${newlyTriggeredAlert.address}. Prepare delivery handover.',
        ongoingNotificationActions: [
          'DISMISS_PROXIMITY_ALERT',
          if (isPaused) 'QUICK_RESUME' else if (!inBreak) 'QUICK_PAUSE',
        ],
      );
    } else {
      state = state.copyWith(geofenceTargets: updatedTargets);
    }
  }

  /// [Q.18] Test & simulation helper to evaluate geofence proximity directly.
  void updateLocationForTesting(
    double lat,
    double lng, {
    double speedKmh = 25.0,
    double accuracy = 10.0,
  }) {
    state = state.copyWith(
      lastLatitude: lat,
      lastLongitude: lng,
      lastSpeedKmh: speedKmh,
      lastAccuracyMeters: accuracy,
      pointsRecordedCount: state.pointsRecordedCount + 1,
    );
    _evaluateGeofences(lat, lng);
  }

  /// [Q.19] Battery Temperature Safety Cutoff:
  /// Suspends continuous GPS collection if battery temperature > 45.0°C under direct sunlight.
  /// Automatically resumes when battery temperature cools down to <= 40.0°C.
  void updateBatteryTemperature(double temperatureCelsius) {
    final shouldCutoff = temperatureCelsius > maxSafeBatteryTemperatureCelsius;
    final canRecover = temperatureCelsius <= safeRecoveryTemperatureCelsius;

    if (shouldCutoff && !state.isThermalCutoffActive) {
      _locationTimer?.cancel();
      _locationTimer = null;
      state = state.copyWith(
        batteryTemperatureCelsius: temperatureCelsius,
        isThermalCutoffActive: true,
        ongoingNotificationTitle: 'SMS Telematics Suspended (Overheating)',
        ongoingNotificationBody:
            'Battery ${temperatureCelsius.toStringAsFixed(1)}°C (>45°C). GPS suspended for device safety.',
        ongoingNotificationActions: const [],
      );
      _recordSessionEvent(
        'BATTERY_THERMAL_CUTOFF',
        'Device battery temperature reached ${temperatureCelsius.toStringAsFixed(1)}°C (>45.0°C under sunlight). GPS collection suspended for hardware thermal safety.',
      );
    } else if (canRecover && state.isThermalCutoffActive) {
      final inBreak = _isWithinBreakWindow(DateTime.now());
      final isPaused = state.sessionState == TrackingSessionState.pausedManual;
      state = state.copyWith(
        batteryTemperatureCelsius: temperatureCelsius,
        isThermalCutoffActive: false,
        ongoingNotificationTitle: inBreak
            ? 'SMS Telematics Paused (Break Window)'
            : isPaused
            ? 'SMS Field Telematics Paused'
            : 'SMS Field Telematics Active',
        ongoingNotificationBody:
            'Battery cooled to ${temperatureCelsius.toStringAsFixed(1)}°C (<=40°C). GPS tracking recovered.',
        ongoingNotificationActions: isPaused
            ? const ['QUICK_RESUME']
            : inBreak
            ? const []
            : const ['QUICK_PAUSE'],
      );

      if (state.sessionState == TrackingSessionState.active && !inBreak) {
        _restartLocationTimer(state.collectionIntervalSeconds);
      }

      _recordSessionEvent(
        'BATTERY_THERMAL_RECOVERED',
        'Device battery temperature cooled down to ${temperatureCelsius.toStringAsFixed(1)}°C (<=40.0°C). GPS collection safely resumed.',
      );
    } else {
      state = state.copyWith(batteryTemperatureCelsius: temperatureCelsius);
    }
  }

  /// [Q.17] Adaptive battery monitoring: throttles collection rate to 60s when battery < 15%.
  void updateBatteryLevel(int batteryLevel) {
    final clamped = batteryLevel.clamp(0, 100);
    final shouldThrottle = clamped < lowBatteryThreshold;

    if (shouldThrottle && !state.isLowBatteryThrottled) {
      state = state.copyWith(
        batteryLevelPct: clamped,
        isLowBatteryThrottled: true,
        collectionIntervalSeconds: throttledIntervalSeconds,
      );
      _restartLocationTimer(throttledIntervalSeconds);
      _recordSessionEvent(
        'BATTERY_LOW_THROTTLE',
        'Device battery dropped to $clamped% (<$lowBatteryThreshold%). GPS collection interval throttled to ${throttledIntervalSeconds}s to conserve power.',
      );
    } else if (!shouldThrottle && state.isLowBatteryThrottled) {
      state = state.copyWith(
        batteryLevelPct: clamped,
        isLowBatteryThrottled: false,
        collectionIntervalSeconds: normalIntervalSeconds,
      );
      _restartLocationTimer(normalIntervalSeconds);
      _recordSessionEvent(
        'BATTERY_RECOVERED',
        'Device battery recovered to $clamped% (>=$lowBatteryThreshold%). GPS collection interval restored to ${normalIntervalSeconds}s.',
      );
    } else {
      state = state.copyWith(batteryLevelPct: clamped);
    }
  }

  bool _isWithinBreakWindow(DateTime time) {
    final nowMinutes = time.hour * 60 + time.minute;
    final startMinutes = breakStartHour * 60 + breakStartMinute;
    final endMinutes = breakEndHour * 60 + breakEndMinute;
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  /// Start a task-bounded GPS tracking session.
  /// Driver: 1 delivery trip = 1 tracking session covering multiple delivery orders.
  /// Surveyor / Collector: 1 assigned task = 1 tracking session.
  /// SALESPERSON IS EXPLICITLY EXCLUDED.
  Future<bool> startTracking({
    required String taskType,
    required String taskCode,
    String? vehiclePlate,
    List<GeofenceTarget>? geofenceTargets,
  }) async {
    final authState = ref.read(authProvider);
    final user = authState.user;

    // Invariant: Salespersons are strictly excluded from GPS tracking
    if (user != null && user.isSalesperson) {
      state = state.copyWith(
        sessionState: TrackingSessionState.notStarted,
        errorMessage:
            'Salespersons are strictly excluded from GPS tracking under privacy policy.',
      );
      return false;
    }

    final client = ref.read(apiClientProvider);
    String assignedSessionId = 'sess-${DateTime.now().millisecondsSinceEpoch}';

    try {
      final response = await client.dio.post(
        '/api/v1/fleet/sessions/start',
        data: {
          'employeeId': user?.id ?? 'emp-anon',
          'employeeName': user?.fullName ?? 'Field Staff',
          'employeeRole': taskType == 'DELIVERY_TRIP'
              ? 'DRIVER'
              : taskType == 'SURVEY_TASK'
              ? 'SURVEYOR'
              : 'COLLECTOR',
          'taskType': taskType,
          'taskCode': taskCode,
          'vehicleRegistrationNumber': vehiclePlate,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        assignedSessionId = (response.data['id'] ?? assignedSessionId)
            .toString();
      }
    } catch (e) {
      // Offline fallback: buffer start action in offline queue
      if (e is DioException) {
        ref
            .read(offlineSyncProvider.notifier)
            .enqueueAction(
              actionType: 'FLEET_SESSION_START',
              endpoint: '/api/v1/fleet/sessions/start',
              payload: {
                'employeeId': user?.id ?? 'emp-anon',
                'employeeName': user?.fullName ?? 'Field Staff',
                'employeeRole': taskType == 'DELIVERY_TRIP'
                    ? 'DRIVER'
                    : taskType == 'SURVEY_TASK'
                    ? 'SURVEYOR'
                    : 'COLLECTOR',
                'taskType': taskType,
                'taskCode': taskCode,
                'vehicleRegistrationNumber': vehiclePlate,
              },
            );
      }
    }

    final now = DateTime.now();
    final inBreak = _isWithinBreakWindow(now);
    final isLowBattery = state.batteryLevelPct < lowBatteryThreshold;
    final interval = isLowBattery
        ? throttledIntervalSeconds
        : normalIntervalSeconds;

    state = state.copyWith(
      sessionState: inBreak
          ? TrackingSessionState.pausedBreak
          : TrackingSessionState.active,
      sessionId: assignedSessionId,
      taskType: taskType,
      taskCode: taskCode,
      vehiclePlate: vehiclePlate,
      isBreakActive: inBreak,
      pauseReason: inBreak ? 'Scheduled Break (Lunch)' : null,
      pointsRecordedCount: 0,
      isLowBatteryThrottled: isLowBattery,
      collectionIntervalSeconds: interval,
      geofenceTargets: geofenceTargets ?? state.geofenceTargets,
    );

    _startTrackingLoops();
    return true;
  }

  void _startTrackingLoops() {
    _stopTimers();

    final interval = state.collectionIntervalSeconds;

    if (!state.isThermalCutoffActive) {
      // 1. Periodic coordinate collection loop (adaptive 15s or 60s)
      _locationTimer = Timer.periodic(Duration(seconds: interval), (_) {
        _collectAndSendLocation();
      });

      // Initial coordinate collect
      _collectAndSendLocation();
    }

    // 2. Break window enforcement watchdog (every 30 seconds)
    _breakCheckTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _evaluateBreakWindow();
    });
  }

  Future<void> _evaluateBreakWindow() async {
    if (!state.isTracking) return;

    final now = DateTime.now();
    final shouldPause = _isWithinBreakWindow(now);

    if (shouldPause && state.sessionState == TrackingSessionState.active) {
      // Automatically pause GPS collection for scheduled break
      state = state.copyWith(
        sessionState: TrackingSessionState.pausedBreak,
        isBreakActive: true,
        pauseReason: 'Scheduled Break Window Enforced (12:00 - 13:00)',
      );
      await _recordSessionEvent(
        'SCHEDULED_BREAK_PAUSE',
        'Lunch break automatic pause',
      );
    } else if (!shouldPause &&
        state.sessionState == TrackingSessionState.pausedBreak) {
      // Break concluded: automatically resume tracking if task still open
      state = state.copyWith(
        sessionState: TrackingSessionState.active,
        isBreakActive: false,
        pauseReason: null,
      );
      await _recordSessionEvent(
        'SCHEDULED_BREAK_RESUME',
        'Lunch break concluded; auto-resumed',
      );
    }
  }

  /// Collects GPS point and dispatches to /api/v1/fleet/locations.
  /// REJECTS coordinate recording if currently paused for break!
  Future<void> _collectAndSendLocation() async {
    if (state.sessionState != TrackingSessionState.active ||
        state.isThermalCutoffActive) {
      // Zero GPS coordinates collected during break, manual pause, or thermal cutoff
      return;
    }

    try {
      double lat = -6.1820;
      double lng = 106.8350;
      double speedKmh = 25.0;
      double accuracy = 10.0;

      // Try reading actual hardware location if available
      try {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 5),
          ),
        );
        lat = pos.latitude;
        lng = pos.longitude;
        speedKmh = (pos.speed * 3.6).clamp(0.0, 150.0);
        accuracy = pos.accuracy;
      } catch (_) {
        // Fallback simulated jitter for emulator / offline testing
        lat += (DateTime.now().second % 10) * 0.0005;
        lng += (DateTime.now().second % 10) * 0.0005;
      }

      final pointPayload = {
        'latitude': lat,
        'longitude': lng,
        'accuracyMeters': accuracy,
        'speedMps': speedKmh / 3.6,
        'headingDegrees': 85.0,
        'altitudeMeters': 15.0,
        'batteryLevelPct': state.batteryLevelPct,
        'batteryTemperatureCelsius': state.batteryTemperatureCelsius,
        'recordedAt': DateTime.now().toUtc().toIso8601String(),
      };

      final client = ref.read(apiClientProvider);
      try {
        await client.dio.post(
          '/api/v1/fleet/locations',
          data: {
            'sessionId': state.sessionId,
            'locations': [pointPayload],
          },
        );
      } catch (e) {
        // Network timeout / offline: buffer in offline queue
        if (e is DioException) {
          ref
              .read(offlineSyncProvider.notifier)
              .enqueueAction(
                actionType: 'FLEET_LOCATION_INGESTION',
                endpoint: '/api/v1/fleet/locations',
                payload: {
                  'sessionId': state.sessionId,
                  'locations': [pointPayload],
                },
              );
        }
      }

      state = state.copyWith(
        lastLatitude: lat,
        lastLongitude: lng,
        lastSpeedKmh: speedKmh,
        lastAccuracyMeters: accuracy,
        pointsRecordedCount: state.pointsRecordedCount + 1,
      );

      // Evaluate dynamic geofence proximity against active destinations
      _evaluateGeofences(lat, lng);
    } catch (err) {
      if (kDebugMode) {
        print('Fleet location ingestion error: $err');
      }
    }
  }

  /// [Q.16] Quick manual pause directly triggered from ongoing system notification action.
  /// Immediate 1-tap operation without opening app dialog.
  Future<void> quickNotificationPause([String? reason]) async {
    if (state.sessionState != TrackingSessionState.active) return;

    final effectiveReason =
        reason ??
        'Quick Pause from System Notification (Emergency / Road Stop)';

    state = state.copyWith(
      sessionState: TrackingSessionState.pausedManual,
      pauseReason: effectiveReason,
      pauseExplanation: reason == null
          ? WorkerMessage((l10n) => l10n.trackingSystemPause)
          : null,
      clearPauseExplanation: reason != null,
      lastNotificationActionTriggered: 'QUICK_PAUSE',
      ongoingNotificationTitle: 'SMS Field Telematics Paused',
      ongoingNotificationBody:
          'Tracking paused via notification action: $effectiveReason',
      ongoingNotificationActions: const ['QUICK_RESUME'],
    );
    await _recordSessionEvent('MANUAL_PAUSE', effectiveReason);
  }

  /// [Q.16] Quick manual resume triggered from ongoing system notification action.
  Future<void> quickNotificationResume() async {
    if (state.sessionState != TrackingSessionState.pausedManual) return;

    final inBreak = _isWithinBreakWindow(DateTime.now());
    if (inBreak) {
      state = state.copyWith(
        sessionState: TrackingSessionState.pausedBreak,
        isBreakActive: true,
        pauseReason: 'Scheduled Break Window Enforced (12:00 - 13:00)',
        lastNotificationActionTriggered: 'QUICK_RESUME_BLOCKED_BY_BREAK',
        ongoingNotificationTitle: 'SMS Telematics Paused (Break Window)',
        ongoingNotificationBody:
            'Break window active (12:00 - 13:00). Zero coordinates collected.',
        ongoingNotificationActions: const [],
      );
      return;
    }

    state = state.copyWith(
      sessionState: TrackingSessionState.active,
      clearPauseReason: true,
      lastNotificationActionTriggered: 'QUICK_RESUME',
      ongoingNotificationTitle: 'SMS Field Telematics Active',
      ongoingNotificationBody:
          'Tracking active for task ${state.taskCode ?? "TASK"}',
      ongoingNotificationActions: const ['QUICK_PAUSE'],
    );
    await _recordSessionEvent(
      'MANUAL_RESUME',
      'Quick resume via system notification action',
    );
  }

  /// [Q.16 & Q.18] Universal notification action intent handler.
  Future<void> handleSystemNotificationAction(String actionCode) async {
    switch (actionCode) {
      case 'QUICK_PAUSE':
        await quickNotificationPause();
        break;
      case 'QUICK_RESUME':
        await quickNotificationResume();
        break;
      case 'DISMISS_PROXIMITY_ALERT':
        dismissProximityAlert();
        break;
      default:
        break;
    }
  }

  /// Pause tracking manually with required reason (e.g. vehicle repair, emergency).
  Future<void> pauseManual(String reason) async {
    if (state.sessionState != TrackingSessionState.active) return;

    state = state.copyWith(
      sessionState: TrackingSessionState.pausedManual,
      pauseReason: reason,
      clearPauseExplanation: true,
    );
    await _recordSessionEvent('MANUAL_PAUSE', reason);
  }

  /// Resume manual tracking.
  Future<void> resumeManual() async {
    if (state.sessionState != TrackingSessionState.pausedManual) return;

    final inBreak = _isWithinBreakWindow(DateTime.now());
    if (inBreak) {
      state = state.copyWith(
        sessionState: TrackingSessionState.pausedBreak,
        isBreakActive: true,
        pauseReason: 'Scheduled Break Window Enforced (12:00 - 13:00)',
      );
      return;
    }

    state = state.copyWith(
      sessionState: TrackingSessionState.active,
      clearPauseReason: true,
    );
    await _recordSessionEvent('MANUAL_RESUME', 'Manual resume by employee');
  }

  /// Complete tracking session and close task.
  Future<void> completeTracking() async {
    final client = ref.read(apiClientProvider);
    final sid = state.sessionId;

    _stopTimers();

    if (sid != null) {
      try {
        await client.dio.post('/api/v1/fleet/sessions/$sid/complete');
      } catch (e) {
        if (e is DioException) {
          ref
              .read(offlineSyncProvider.notifier)
              .enqueueAction(
                actionType: 'FLEET_SESSION_COMPLETE',
                endpoint: '/api/v1/fleet/sessions/$sid/complete',
                payload: {},
              );
        }
      }
    }

    state = state.copyWith(
      sessionState: TrackingSessionState.completed,
      clearPauseReason: true,
      clearProximityAlert: true,
    );
  }

  Future<void> _recordSessionEvent(String eventType, String notes) async {
    final sid = state.sessionId;
    if (sid == null) return;

    final client = ref.read(apiClientProvider);
    try {
      await client.dio.post(
        '/api/v1/fleet/sessions/$sid/events',
        data: {'eventType': eventType, 'notes': notes},
      );
    } catch (_) {}
  }
}

final fleetTrackingProvider =
    NotifierProvider<FleetTrackingNotifier, FleetTrackingState>(
      () => FleetTrackingNotifier(),
    );
