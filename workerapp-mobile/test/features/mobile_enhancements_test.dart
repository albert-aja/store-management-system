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
import 'package:sms_mobile/features/inventory/screens/stocktake_screen.dart';
import 'package:sms_mobile/features/inventory/screens/warehouse_picking_screen.dart';
import 'package:sms_mobile/features/notifications/screens/notification_center_screen.dart';
import 'package:sms_mobile/features/sales/screens/sales_work_center_screen.dart';

const testUser = UserProfile(
  id: 'user-001',
  fullName: 'Test Worker',
  employeeNumber: 'EMP-001',
  storeId: 'store-001',
  storeName: 'Test Branch',
  roles: ['MANAGER', 'SALESPERSON', 'WAREHOUSE'],
  permissions: ['DELIVERY_MANAGE', 'SURVEY_MANAGE', 'SURVEY_DECIDE'],
);

class FakeAuthNotifier extends AuthNotifier {
  @override
  AuthState build() {
    return const AuthState(user: testUser);
  }
}

class MockAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    String body = '[]';
    if (options.path.contains('/api/stocktakes')) {
      body = '{"id": "session-1", "status": "OPEN"}';
    }
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

class FakeApiClient extends ApiClient {
  FakeApiClient() {
    dio.httpClientAdapter = MockAdapter();
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({'worker_ui_language': 'en'});
  });

  Widget createTestWidget(Widget child) {
    return ProviderScope(
      overrides: [
        apiClientProvider.overrideWithValue(FakeApiClient()),
        authProvider.overrideWith(() => FakeAuthNotifier()),
      ],
      child: MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: child,
      ),
    );
  }

  group('Mobile Enhancements Verification [M.1 - M.6]', () {
    testWidgets(
      'M.4: Salesperson Work Center displays quota progress bar and actuals',
      (tester) async {
        await tester.pumpWidget(
          createTestWidget(const SalesWorkCenterScreen()),
        );
        await tester.pumpAndSettle();

        expect(find.text('Salesperson Work Center'), findsOneWidget);
        expect(find.byType(Card), findsWidgets);
        expect(find.byType(LinearProgressIndicator), findsOneWidget);
        expect(find.textContaining('Target: Rp 50,000,000'), findsOneWidget);
        expect(find.textContaining('Estimated Commission:'), findsOneWidget);
      },
    );

    testWidgets('M.5: Mobile Stocktake Screen initializes blind count buffer', (
      tester,
    ) async {
      await tester.pumpWidget(createTestWidget(const StocktakeScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Mobile Stocktake'), findsOneWidget);
      expect(find.text('Blind count'), findsOneWidget);
      expect(find.textContaining('0 scanned'), findsOneWidget);
      expect(find.text('Submit for supervisor review'), findsOneWidget);
    });

    testWidgets('M.6: Notification Center renders actionable hub header', (
      tester,
    ) async {
      await tester.pumpWidget(
        createTestWidget(const NotificationCenterScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Actionable Notifications'), findsOneWidget);
      expect(find.byIcon(Icons.refresh), findsOneWidget);
    });

    testWidgets(
      'M.2: Warehouse Guided Picking Screen initializes manifest scan view',
      (tester) async {
        await tester.pumpWidget(
          createTestWidget(const WarehousePickingScreen()),
        );
        await tester.pumpAndSettle();

        expect(find.text('Guided Picking & Packing'), findsOneWidget);
      },
    );
  });
}
