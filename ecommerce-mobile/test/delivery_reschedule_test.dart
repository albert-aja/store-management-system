import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ecommerce_mobile/core/api_client.dart';
import 'package:ecommerce_mobile/models/customer_profile.dart';
import 'package:ecommerce_mobile/models/delivery_schedule_model.dart';
import 'package:ecommerce_mobile/providers/auth_provider.dart';
import 'package:ecommerce_mobile/providers/catalog_provider.dart';
import 'package:ecommerce_mobile/widgets/delivery_reschedule_panel.dart';

class CustomerAuth extends AuthNotifier {
  CustomerAuth({this.guest = false});
  final bool guest;
  @override
  Future<CustomerProfile?> build() async => guest
      ? null
      : CustomerProfile(
          customerId: 'customer-1',
          email: 'customer@example.test',
          fullName: 'Customer',
        );
}

class ScheduleApi implements ApiClient {
  int loads = 0;
  bool eligible = true;
  bool fail = false;
  String? date;
  String? window;
  final requests = <DeliveryRescheduleRequest>[];

  @override
  Future<List<DeliverySchedule>> getDeliverySchedules(String orderId) async {
    loads++;
    return [
      DeliverySchedule(
        deliveryOrderId: 'do-1',
        deliveryOrderNumber: 'DO-1',
        deliveryDate: '2026-11-05',
        deliveryWindow: 'MORNING',
        plannedDispatchAt: '2026-11-05T02:00:00Z',
        eligible: eligible,
        unavailableReason: eligible ? null : 'Awaiting review',
        requests: List.of(requests),
      ),
    ];
  }

  @override
  Future<DeliveryRescheduleRequest> requestDeliveryReschedule(
    String deliveryOrderId, {
    required String requestedDate,
    required String requestedWindow,
    String? reason,
  }) async {
    if (fail) {
      throw DioException(
        requestOptions: RequestOptions(),
        response: Response(
          requestOptions: RequestOptions(),
          data: {'message': '24-hour cutoff reached'},
        ),
      );
    }
    date = requestedDate;
    window = requestedWindow;
    eligible = false;
    final request = DeliveryRescheduleRequest(
      id: 'request-1',
      requestedDate: requestedDate,
      requestedWindow: requestedWindow,
      status: 'PENDING',
    );
    requests.add(request);
    return request;
  }

  @override
  Object? noSuchMethod(Invocation invocation) =>
      throw UnimplementedError(invocation.memberName.toString());
}

Future<void> open(
  WidgetTester tester,
  ScheduleApi api, {
  bool guest = false,
}) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authProvider.overrideWith(() => CustomerAuth(guest: guest)),
        apiClientProvider.overrideWithValue(api),
      ],
      child: const MaterialApp(
        locale: Locale('id'),
        supportedLocales: [Locale('id'), Locale('en')],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        home: Scaffold(
          body: SingleChildScrollView(
            child: DeliveryReschedulePanel(orderId: 'order-1'),
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

Future<void> chooseDate(WidgetTester tester) async {
  await tester.tap(find.text('Pilih tanggal pengiriman baru'));
  await tester.pumpAndSettle();
  final context = tester.element(find.byType(DatePickerDialog));
  await tester.tap(find.text(MaterialLocalizations.of(context).okButtonLabel));
  await tester.pumpAndSettle();
}

void main() {
  test('model preserves pending and approved decision history', () {
    final stop = DeliverySchedule.fromJson({
      'deliveryOrderId': 'do-1',
      'deliveryOrderNumber': 'DO-1',
      'eligible': false,
      'requests': [
        {
          'id': 'request-1',
          'requestedDate': '2026-11-05',
          'requestedWindow': 'AFTERNOON',
          'status': 'APPROVED',
          'decisionNotes': 'Confirmed',
        },
      ],
    });
    expect(stop.requests.single.status, 'APPROVED');
    expect(stop.requests.single.decisionNotes, 'Confirmed');
    expect(windowLabel('AFTERNOON'), '12:00–17:00 WIB');
  });

  testWidgets('guest cannot fetch private delivery schedule', (tester) async {
    final api = ScheduleApi();
    await open(tester, api, guest: true);
    expect(
      find.text('Masuk untuk mengatur pengiriman milik Anda'),
      findsOneWidget,
    );
    expect(api.loads, 0);
  });

  testWidgets('phone date/window request waits for dispatcher approval', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(320, 1100);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final api = ScheduleApi();
    await open(tester, api);
    expect(
      find.text(
        'Rencana berangkat: ${DateFormat.yMMMd('id_ID').add_Hm().format(DateTime(2026, 11, 5, 9))} WIB',
      ),
      findsOneWidget,
    );
    await chooseDate(tester);
    await tester.tap(find.text('Pagi · 09:00–12:00'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Siang · 12:00–17:00').last);
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Ajukan perubahan jadwal'));
    await tester.tap(find.text('Ajukan perubahan jadwal'));
    await tester.pumpAndSettle();
    expect(api.date, isNotNull);
    expect(api.window, 'AFTERNOON');
    expect(find.textContaining('Jadwal belum berubah'), findsOneWidget);
    expect(find.textContaining('Menunggu persetujuan'), findsOneWidget);
    expect(find.text('Ajukan perubahan jadwal'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('backend cutoff error stays visible without success', (
    tester,
  ) async {
    final api = ScheduleApi()..fail = true;
    await open(tester, api);
    await chooseDate(tester);
    await tester.tap(find.text('Ajukan perubahan jadwal'));
    await tester.pumpAndSettle();
    expect(find.text('24-hour cutoff reached'), findsOneWidget);
    expect(find.textContaining('Jadwal belum berubah'), findsNothing);
    expect(api.requests, isEmpty);
  });
}
