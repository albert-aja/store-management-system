import 'package:flutter/material.dart';
import 'package:sms_mobile/l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sms_mobile/core/hardware/active_tracking_banner.dart';
import 'package:sms_mobile/core/hardware/fleet_tracking_service.dart';
import 'package:sms_mobile/core/models/user_profile.dart';
import 'package:sms_mobile/features/auth/providers/auth_provider.dart';

void main() {
  group('Fleet Tracking Mobile Integration Tests [Q.9, Q.16, Q.17, Q.18, Q.19]', () {
    test(
      'Driver starting delivery trip initiates active tracking session',
      () async {
        final container = ProviderContainer(
          overrides: [
            authProvider.overrideWith(() {
              final notifier = AuthNotifier();
              return notifier;
            }),
          ],
        );

        // Authenticate as Driver
        container.read(authProvider.notifier).state = const AuthState(
          user: UserProfile(
            id: 'driver-001',
            fullName: 'Budi Santoso',
            employeeNumber: 'EMP-001',
            roles: ['DRIVER'],
            permissions: ['DELIVERY_EXECUTE'],
          ),
        );

        final notifier = container.read(fleetTrackingProvider.notifier);
        final success = await notifier.startTracking(
          taskType: 'DELIVERY_TRIP',
          taskCode: 'TRIP-082',
          vehiclePlate: 'B 9142 SAA',
        );

        expect(success, isTrue);
        final state = container.read(fleetTrackingProvider);
        expect(state.isTracking, isTrue);
        expect(state.taskType, 'DELIVERY_TRIP');
        expect(state.taskCode, 'TRIP-082');
        expect(state.vehiclePlate, 'B 9142 SAA');

        // Manual pause
        await notifier.pauseManual('Ganti ban kempes');
        expect(
          container.read(fleetTrackingProvider).sessionState,
          TrackingSessionState.pausedManual,
        );
        expect(
          container.read(fleetTrackingProvider).pauseReason,
          'Ganti ban kempes',
        );

        // Manual resume
        await notifier.resumeManual();
        expect(
          container.read(fleetTrackingProvider).sessionState,
          TrackingSessionState.active,
        );

        // Complete tracking
        await notifier.completeTracking();
        expect(
          container.read(fleetTrackingProvider).sessionState,
          TrackingSessionState.completed,
        );
      },
    );

    test(
      'Salesperson is strictly blocked from initiating GPS tracking session',
      () async {
        final container = ProviderContainer();

        // Authenticate as Salesperson
        container.read(authProvider.notifier).state = const AuthState(
          user: UserProfile(
            id: 'sales-001',
            fullName: 'Salesperson Maya',
            employeeNumber: 'EMP-002',
            roles: ['SALESPERSON'],
            permissions: ['SALES_ORDER_CREATE'],
          ),
        );

        final notifier = container.read(fleetTrackingProvider.notifier);
        final success = await notifier.startTracking(
          taskType: 'SURVEY_TASK',
          taskCode: 'SV-001',
        );

        expect(success, isFalse);
        final state = container.read(fleetTrackingProvider);
        expect(state.sessionState, TrackingSessionState.notStarted);
        expect(
          state.errorMessage,
          contains('Salespersons are strictly excluded'),
        );
      },
    );

    test(
      'Low-battery adaptive GPS throttle scales collection to 60s when battery < 15% [Q.17]',
      () async {
        final container = ProviderContainer();
        final notifier = container.read(fleetTrackingProvider.notifier);

        // Initial normal battery (85%) -> normal interval 15s
        expect(
          container.read(fleetTrackingProvider).isLowBatteryThrottled,
          isFalse,
        );
        expect(
          container.read(fleetTrackingProvider).collectionIntervalSeconds,
          15,
        );

        // Battery drops to 12% (<15%) -> throttled to 60s
        notifier.updateBatteryLevel(12);
        final throttledState = container.read(fleetTrackingProvider);
        expect(throttledState.batteryLevelPct, 12);
        expect(throttledState.isLowBatteryThrottled, isTrue);
        expect(throttledState.collectionIntervalSeconds, 60);

        // Battery charges back to 25% (>=15%) -> restored to 15s
        notifier.updateBatteryLevel(25);
        final recoveredState = container.read(fleetTrackingProvider);
        expect(recoveredState.batteryLevelPct, 25);
        expect(recoveredState.isLowBatteryThrottled, isFalse);
        expect(recoveredState.collectionIntervalSeconds, 15);
      },
    );

    testWidgets(
      'ActiveTrackingBanner renders standby, active, break, and battery throttle states',
      (tester) async {
        final container = ProviderContainer();

        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: const MaterialApp(
              locale: Locale('en'),
              localizationsDelegates: AppLocalizations.localizationsDelegates,
              supportedLocales: AppLocalizations.supportedLocales,
              home: Scaffold(body: ActiveTrackingBanner()),
            ),
          ),
        );

        // Initial standby
        expect(find.textContaining('GPS Tracking Standby'), findsOneWidget);

        // Switch to active tracking
        container
            .read(fleetTrackingProvider.notifier)
            .state = const FleetTrackingState(
          sessionState: TrackingSessionState.active,
          taskCode: 'TRIP-082',
          lastSpeedKmh: 35.0,
          pointsRecordedCount: 12,
        );
        await tester.pumpAndSettle();

        expect(find.text('GPS Tracking Active'), findsOneWidget);
        expect(find.textContaining('TRIP-082'), findsOneWidget);
        expect(find.text('Quick Pause'), findsOneWidget);
        expect(find.text('NOTIF PAUSE'), findsOneWidget);

        // Low-battery throttled state [Q.17]
        container
            .read(fleetTrackingProvider.notifier)
            .state = const FleetTrackingState(
          sessionState: TrackingSessionState.active,
          taskCode: 'TRIP-082',
          isLowBatteryThrottled: true,
          batteryLevelPct: 11,
        );
        await tester.pumpAndSettle();

        expect(find.textContaining('Low Battery (11%)'), findsOneWidget);
        expect(find.textContaining('Throttled 60s'), findsOneWidget);

        // Break state (strict break window)
        container
            .read(fleetTrackingProvider.notifier)
            .state = const FleetTrackingState(
          sessionState: TrackingSessionState.pausedBreak,
          isBreakActive: true,
        );
        await tester.pumpAndSettle();

        expect(
          find.text('GPS Paused — Scheduled Break Enforced'),
          findsOneWidget,
        );
        expect(
          find.textContaining('Zero coordinates collected'),
          findsOneWidget,
        );

        // Manual pause state
        container
            .read(fleetTrackingProvider.notifier)
            .state = const FleetTrackingState(
          sessionState: TrackingSessionState.pausedManual,
          pauseReason: 'Perbaikan ban motor',
          ongoingNotificationActions: ['QUICK_RESUME'],
        );
        await tester.pumpAndSettle();

        expect(
          find.textContaining('Tracking Paused: Perbaikan ban motor'),
          findsOneWidget,
        );
        expect(find.text('Resume'), findsOneWidget);
        expect(find.text('NOTIF RESUME'), findsOneWidget);

        // Thermal cutoff state [Q.19]
        container
            .read(fleetTrackingProvider.notifier)
            .state = const FleetTrackingState(
          sessionState: TrackingSessionState.active,
          isThermalCutoffActive: true,
          batteryTemperatureCelsius: 47.5,
        );
        await tester.pumpAndSettle();

        expect(
          find.textContaining('Thermal Cutoff Active (47.5°C > 45°C)'),
          findsOneWidget,
        );
        expect(
          find.textContaining(
            'Continuous GPS pinging suspended to prevent device battery overheating',
          ),
          findsOneWidget,
        );
      },
    );

    test(
      'Quick notification pause and resume state transitions [Q.16]',
      () async {
        final container = ProviderContainer();
        final notifier = container.read(fleetTrackingProvider.notifier);

        // Start active tracking
        notifier.state = const FleetTrackingState(
          sessionState: TrackingSessionState.active,
          taskCode: 'TRIP-082',
        );

        expect(
          container.read(fleetTrackingProvider).sessionState,
          TrackingSessionState.active,
        );
        expect(
          container.read(fleetTrackingProvider).ongoingNotificationActions,
          contains('QUICK_PAUSE'),
        );

        // Trigger quick notification pause
        await notifier.quickNotificationPause('Road accident roadblock');

        final pausedState = container.read(fleetTrackingProvider);
        expect(pausedState.sessionState, TrackingSessionState.pausedManual);
        expect(pausedState.pauseReason, 'Road accident roadblock');
        expect(pausedState.lastNotificationActionTriggered, 'QUICK_PAUSE');
        expect(
          pausedState.ongoingNotificationActions,
          contains('QUICK_RESUME'),
        );

        // Trigger quick notification resume
        await notifier.quickNotificationResume();

        final resumedState = container.read(fleetTrackingProvider);
        expect(resumedState.sessionState, TrackingSessionState.active);
        expect(resumedState.pauseReason, isNull);
        expect(resumedState.lastNotificationActionTriggered, 'QUICK_RESUME');
        expect(
          resumedState.ongoingNotificationActions,
          contains('QUICK_PAUSE'),
        );

        // Test universal intent handler
        await notifier.handleSystemNotificationAction('QUICK_PAUSE');
        expect(
          container.read(fleetTrackingProvider).sessionState,
          TrackingSessionState.pausedManual,
        );

        await notifier.handleSystemNotificationAction('QUICK_RESUME');
        expect(
          container.read(fleetTrackingProvider).sessionState,
          TrackingSessionState.active,
        );
      },
    );

    test(
      'Battery temperature cutoff suspends continuous GPS collection when temperature > 45.0°C and recovers when <= 40.0°C [Q.19]',
      () async {
        final container = ProviderContainer();
        final notifier = container.read(fleetTrackingProvider.notifier);

        // Start active tracking
        notifier.state = const FleetTrackingState(
          sessionState: TrackingSessionState.active,
          taskCode: 'TRIP-082',
          batteryTemperatureCelsius: 34.0,
        );

        expect(
          container.read(fleetTrackingProvider).isThermalCutoffActive,
          isFalse,
        );

        // Temperature exceeds safety threshold under direct sunlight (46.2°C > 45°C)
        notifier.updateBatteryTemperature(46.2);

        final cutoffState = container.read(fleetTrackingProvider);
        expect(cutoffState.batteryTemperatureCelsius, 46.2);
        expect(cutoffState.isThermalCutoffActive, isTrue);
        expect(cutoffState.ongoingNotificationTitle, contains('Overheating'));
        expect(cutoffState.ongoingNotificationBody, contains('GPS suspended'));

        // Temperature cools down safely in shade (38.5°C <= 40°C)
        notifier.updateBatteryTemperature(38.5);

        final recoveredState = container.read(fleetTrackingProvider);
        expect(recoveredState.batteryTemperatureCelsius, 38.5);
        expect(recoveredState.isThermalCutoffActive, isFalse);
        expect(recoveredState.ongoingNotificationTitle, contains('Active'));
        expect(recoveredState.ongoingNotificationBody, contains('recovered'));
      },
    );

    test(
      'Dynamic geofence proximity alert triggers when arriving within 300m of customer delivery address [Q.18]',
      () async {
        final container = ProviderContainer();
        final notifier = container.read(fleetTrackingProvider.notifier);

        // Start active tracking with 2 geofence targets
        notifier.state = const FleetTrackingState(
          sessionState: TrackingSessionState.active,
          taskCode: 'TRIP-082',
          geofenceTargets: [
            GeofenceTarget(
              id: 'do-0042',
              title: 'Agus Setiawan',
              address: 'Jl. Mampang Prapatan VIII No. 18',
              latitude: -6.1825,
              longitude: 106.8355,
              radiusMeters: 300.0,
            ),
            GeofenceTarget(
              id: 'do-0043',
              title: 'Ratna Sari',
              address: 'Jl. Pejaten Barat No. 88',
              latitude: -6.2800,
              longitude: 106.8300,
              radiusMeters: 300.0,
            ),
          ],
        );

        expect(
          container.read(fleetTrackingProvider).hasProximityAlert,
          isFalse,
        );

        // 1. Position far away: -6.2200, 106.8400 (>4,000m away)
        notifier.updateLocationForTesting(-6.2200, 106.8400);
        expect(
          container.read(fleetTrackingProvider).hasProximityAlert,
          isFalse,
        );
        expect(
          container
              .read(fleetTrackingProvider)
              .geofenceTargets
              .every((t) => !t.isTriggered),
          isTrue,
        );

        // 2. Position approaches destination Agus Setiawan (-6.1820, 106.8350, ~78m away, <= 300m threshold)
        notifier.updateLocationForTesting(-6.1820, 106.8350);
        final alertState = container.read(fleetTrackingProvider);

        expect(alertState.hasProximityAlert, isTrue);
        expect(alertState.activeProximityAlert!.targetId, 'do-0042');
        expect(alertState.activeProximityAlert!.title, 'Agus Setiawan');
        expect(
          alertState.activeProximityAlert!.distanceMeters,
          lessThanOrEqualTo(300.0),
        );
        expect(
          alertState.ongoingNotificationTitle,
          contains('SMS Proximity Alert'),
        );
        expect(alertState.ongoingNotificationBody, contains('Agus Setiawan'));
        expect(
          alertState.ongoingNotificationActions,
          contains('DISMISS_PROXIMITY_ALERT'),
        );

        // Verify target is marked isTriggered = true
        final triggeredTarget = alertState.geofenceTargets.firstWhere(
          (t) => t.id == 'do-0042',
        );
        expect(triggeredTarget.isTriggered, isTrue);
        expect(triggeredTarget.triggeredAt, isNotNull);

        // 3. Dismiss alert via action
        await notifier.handleSystemNotificationAction(
          'DISMISS_PROXIMITY_ALERT',
        );
        final dismissedState = container.read(fleetTrackingProvider);
        expect(dismissedState.hasProximityAlert, isFalse);
        expect(dismissedState.activeProximityAlert, isNull);

        // 4. Repeated coordinate update near same target should NOT re-trigger because isTriggered == true
        notifier.updateLocationForTesting(-6.1821, 106.8351);
        expect(
          container.read(fleetTrackingProvider).hasProximityAlert,
          isFalse,
        );
      },
    );

    testWidgets(
      'ActiveTrackingBanner renders dynamic geofence proximity arrival alert card [Q.18]',
      (tester) async {
        final container = ProviderContainer();

        await tester.pumpWidget(
          UncontrolledProviderScope(
            container: container,
            child: const MaterialApp(
              locale: Locale('en'),
              localizationsDelegates: AppLocalizations.localizationsDelegates,
              supportedLocales: AppLocalizations.supportedLocales,
              home: Scaffold(body: ActiveTrackingBanner()),
            ),
          ),
        );

        // Set active proximity alert
        container
            .read(fleetTrackingProvider.notifier)
            .state = FleetTrackingState(
          sessionState: TrackingSessionState.active,
          taskCode: 'TRIP-082',
          ongoingNotificationActions: const [
            'DISMISS_PROXIMITY_ALERT',
            'QUICK_PAUSE',
          ],
          activeProximityAlert: GeofenceProximityAlert(
            targetId: 'do-0042',
            title: 'Agus Setiawan',
            address: 'Jl. Mampang Prapatan VIII No. 18',
            distanceMeters: 145.0,
            triggeredAt: DateTime.now(),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('🎯 Proximity Alert'), findsOneWidget);
        expect(find.text('145m away'), findsOneWidget);
        expect(find.textContaining('Agus Setiawan'), findsWidgets);
        expect(
          find.textContaining('Jl. Mampang Prapatan VIII No. 18'),
          findsOneWidget,
        );
        expect(find.text('Dismiss'), findsOneWidget);
        expect(find.text('DISMISS ALERT'), findsOneWidget);

        // Tap Dismiss button
        await tester.tap(find.text('Dismiss'));
        await tester.pumpAndSettle();

        expect(find.text('🎯 Proximity Alert'), findsNothing);
      },
    );
  });
}
