import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:sms_mobile/l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms_mobile/core/models/user_profile.dart';
import 'package:sms_mobile/core/network/api_client.dart';
import 'package:sms_mobile/features/auth/providers/auth_provider.dart';
import 'package:sms_mobile/features/delivery/models/delivery_model.dart';
import 'package:sms_mobile/features/delivery/providers/delivery_provider.dart';
import 'package:sms_mobile/features/delivery/services/external_navigation_service.dart';
import 'package:sms_mobile/features/delivery/widgets/navigation_handover_button.dart';
import 'package:sms_mobile/router/app_router.dart';

const order = DeliveryOrderModel(
  id: 'stop-1',
  deliveryOrderNumber: 'DO-1',
  salesOrderId: 'so-1',
  tripId: 'trip-1',
  recipientName: 'Private customer',
  recipientPhone: 'Private phone',
  deliveryAddress: 'Private address',
  codAmount: 0,
  status: 'IN_TRANSIT',
  destinationLatitude: -6.2,
  destinationLongitude: 106.8,
);

class DriverAuth extends AuthNotifier {
  @override
  AuthState build() => const AuthState(
    user: UserProfile(
      id: 'driver-1',
      fullName: 'Driver',
      employeeNumber: 'D1',
      roles: ['DRIVER'],
      permissions: ['DELIVERY_EXECUTE'],
    ),
  );
}

class DeliveryAdapter implements HttpClientAdapter {
  bool fail = false;
  final paths = <String>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    paths.add(options.path);
    if (fail) {
      throw DioException(
        requestOptions: options,
        type: DioExceptionType.connectionError,
        message: 'Offline',
      );
    }
    final body = options.path.startsWith('/api/delivery-trips')
        ? '[{"id":"trip-1","driverEmployeeId":"driver-1","status":"DISPATCHED"},'
              '{"id":"trip-2","driverEmployeeId":"driver-1","status":"DISPATCHED"}]'
        : '[{"id":"stop-2","deliveryTripId":"trip-2",'
              '"destinationLatitude":0,"destinationLongitude":106.8}]';
    return ResponseBody.fromString(
      body,
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  setUp(
    () => SharedPreferences.setMockInitialValues({'worker_ui_language': 'en'}),
  );

  test(
    'GPS validation accepts zero and rejects missing/non-finite/out-of-range',
    () {
      expect(validNavigationDestination(0, 0), isTrue);
      expect(validNavigationDestination(-90, 180), isTrue);
      for (final pair in [
        [null, 1.0],
        [1.0, null],
        [double.nan, 0.0],
        [0.0, double.infinity],
        [91.0, 0.0],
        [0.0, -181.0],
      ]) {
        expect(validNavigationDestination(pair[0], pair[1]), isFalse);
      }
    },
  );

  test(
    'native URLs pass destination only and iOS callback restores trip/stop',
    () {
      final android = ExternalNavigationService(
        platform: TargetPlatform.android,
      );
      final ios = ExternalNavigationService(platform: TargetPlatform.iOS);
      Uri uri(ExternalNavigationService service, NavigationApp app) =>
          service.destinationUri(
            app: app,
            latitude: -6.2,
            longitude: 106.8,
            tripId: 'trip-1',
            stopId: 'stop-1',
          );
      expect(
        uri(android, NavigationApp.googleMaps).toString(),
        'google.navigation:q=-6.2,106.8&mode=d',
      );
      expect(
        uri(android, NavigationApp.waze).queryParameters,
        containsPair('ll', '-6.2,106.8'),
      );
      expect(
        uri(ios, NavigationApp.appleMaps).queryParameters,
        containsPair('daddr', '-6.2,106.8'),
      );
      final google = uri(ios, NavigationApp.googleMaps);
      expect(google.scheme, 'comgooglemaps-x-callback');
      final callback = Uri.parse(google.queryParameters['x-success']!);
      expect(callback.scheme, 'smsworker');
      expect(callback.host, 'navigation');
      expect(callback.path, '/delivery/trip-1');
      expect(callback.queryParameters['stop'], 'stop-1');
      expect(callback.queryParameters['navigationReturn'], 'true');
      expect(google.toString(), isNot(contains('Private')));
      expect(android.supportedApps, isNot(contains(NavigationApp.appleMaps)));
      expect(ExternalNavigationService(isWeb: true).supportedApps, isEmpty);
    },
  );

  test(
    'unavailable and failed apps produce errors, not success or browser fallback',
    () async {
      for (final available in [false, true]) {
        var opened = false;
        final service = ExternalNavigationService(
          platform: TargetPlatform.android,
          canOpen: (_) async => available,
          open: (_) async {
            opened = true;
            return false;
          },
        );
        await expectLater(
          service.navigate(
            app: NavigationApp.waze,
            latitude: 0,
            longitude: 0,
            tripId: 'trip-1',
            stopId: 'stop-1',
          ),
          throwsA(isA<NavigationException>()),
        );
        expect(opened, available);
        expect(await service.preferredApp(), isNull);
      }
    },
  );

  testWidgets(
    'first chooser, remembered one-tap action, and resume callback run once',
    (tester) async {
      var launches = 0;
      var returns = 0;
      final service = ExternalNavigationService(
        platform: TargetPlatform.android,
        canOpen: (_) async => true,
        open: (_) async {
          launches++;
          return true;
        },
      );
      await tester.pumpWidget(
        ProviderScope(
          overrides: [externalNavigationProvider.overrideWithValue(service)],
          child: MaterialApp(
            locale: const Locale('en'),
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            home: Scaffold(
              body: NavigationHandoverButton(
                tripId: 'trip-1',
                order: order,
                onReturned: () => returns++,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Navigate'));
      await tester.pumpAndSettle();
      expect(find.textContaining('Share only destination GPS'), findsOneWidget);
      await tester.tap(find.text('Waze'));
      await tester.pumpAndSettle();
      expect(launches, 1);
      expect(await service.preferredApp(), NavigationApp.waze);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      expect(returns, 1);
      tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
      expect(returns, 1);
      await tester.tap(find.text('Navigate - Waze'));
      await tester.pumpAndSettle();
      expect(launches, 2);
      expect(order.status, 'IN_TRANSIT');
    },
  );

  testWidgets('missing GPS shows dispatch guidance and no launch action', (
    tester,
  ) async {
    final missing = DeliveryOrderModel.fromJson({
      'id': 'stop-1',
      'deliveryTripId': 'trip-1',
      'deliveryWindow': 'AFTERNOON',
    });
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Scaffold(
            body: NavigationHandoverButton(
              tripId: 'trip-1',
              order: missing,
              onReturned: () {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      find.textContaining('destination GPS missing or invalid'),
      findsOneWidget,
    );
    expect(find.byType(FilledButton), findsNothing);
    expect(missing.deliveryWindow, 'AFTERNOON');
  });

  testWidgets('remembered app is reused by another already mounted stop', (
    tester,
  ) async {
    var launches = 0;
    final service = ExternalNavigationService(
      platform: TargetPlatform.android,
      canOpen: (_) async => true,
      open: (_) async {
        launches++;
        return true;
      },
    );
    final nextStop = DeliveryOrderModel.fromJson({
      'id': 'stop-2',
      'deliveryTripId': 'trip-1',
      'destinationLatitude': 0,
      'destinationLongitude': 0,
    });
    await tester.pumpWidget(
      ProviderScope(
        overrides: [externalNavigationProvider.overrideWithValue(service)],
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Scaffold(
            body: Column(
              children: [
                NavigationHandoverButton(
                  tripId: 'trip-1',
                  order: order,
                  onReturned: () {},
                ),
                NavigationHandoverButton(
                  tripId: 'trip-1',
                  order: nextStop,
                  onReturned: () {},
                ),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Navigate').first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Waze'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Navigate'));
    await tester.pumpAndSettle();
    expect(launches, 2);
    expect(find.byType(BottomSheet), findsNothing);
  });

  test(
    'requested trip loads its own stops, never fabricated offline GPS',
    () async {
      final adapter = DeliveryAdapter();
      final client = ApiClient()..dio.httpClientAdapter = adapter;
      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith(DriverAuth.new),
          apiClientProvider.overrideWithValue(client),
        ],
      );
      addTearDown(container.dispose);
      final notifier = container.read(deliveryProvider.notifier);
      await Future<void>.delayed(Duration.zero);
      await notifier.loadDriverTrips(tripId: 'trip-2');
      expect(container.read(deliveryProvider).activeTrip?.id, 'trip-2');
      expect(adapter.paths, contains('/api/delivery-orders/by-trip/trip-2'));
      expect(
        container.read(deliveryProvider).orders.single.destinationLatitude,
        0,
      );
      await notifier.loadDriverTrips();
      expect(container.read(deliveryProvider).activeTrip?.id, 'trip-1');
      adapter.fail = true;
      await notifier.loadDriverTrips();
      expect(container.read(deliveryProvider).orders, isEmpty);
      expect(
        container.read(deliveryProvider).error.toString(),
        contains('Delivery trips could not load'),
      );
    },
  );

  testWidgets('navigation callback preserves destination through login', (
    tester,
  ) async {
    final adapter = DeliveryAdapter();
    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith(DriverAuth.new),
        apiClientProvider.overrideWithValue(
          ApiClient()..dio.httpClientAdapter = adapter,
        ),
      ],
    );
    addTearDown(container.dispose);
    container.read(authProvider.notifier).state = const AuthState();
    final router = container.read(routerProvider);
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          routerConfig: router,
        ),
      ),
    );
    router.go(
      'smsworker://navigation/delivery/trip-2?navigationReturn=true&stop=stop-2',
    );
    await tester.pumpAndSettle();
    expect(router.routeInformationProvider.value.uri.path, '/login');
    container.read(authProvider.notifier).state = DriverAuth().build();
    await tester.pumpAndSettle();
    final uri = router.routeInformationProvider.value.uri;
    expect(uri.path, '/delivery/trip-2');
    expect(uri.queryParameters['stop'], 'stop-2');
    expect(find.textContaining('Navigation does not confirm'), findsOneWidget);
  });
}
