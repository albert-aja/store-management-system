import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms_mobile/core/models/user_profile.dart';
import 'package:sms_mobile/core/network/api_client.dart';
import 'package:sms_mobile/features/auth/providers/auth_provider.dart';
import 'package:sms_mobile/features/sales/screens/sales_work_center_screen.dart';
import 'package:sms_mobile/l10n/app_localizations.dart';

class MockDioClient extends Fake implements Dio {
  final Map<String, dynamic> personalTierData;
  final List<Map<String, dynamic>> teamLeaderboardData;

  MockDioClient({
    required this.personalTierData,
    required this.teamLeaderboardData,
  });

  @override
  Future<Response<T>> get<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) async {
    if (path.contains('/my-tier')) {
      return Response<T>(
        data: personalTierData as T,
        statusCode: 200,
        requestOptions: RequestOptions(path: path),
      );
    }
    if (path.contains('/sales-performance')) {
      return Response<T>(
        data: teamLeaderboardData as T,
        statusCode: 200,
        requestOptions: RequestOptions(path: path),
      );
    }
    return Response<T>(
      data: [] as T,
      statusCode: 200,
      requestOptions: RequestOptions(path: path),
    );
  }
}

class TestApiClient extends ApiClient {
  final Dio mockDio;
  TestApiClient(this.mockDio);
  @override
  Dio get dio => mockDio;
}

class TestAuthNotifier extends AuthNotifier {
  final UserProfile testUser;
  TestAuthNotifier(this.testUser);
  @override
  AuthState build() => AuthState(user: testUser);
}

Widget createTestApp({
  required UserProfile user,
  required ApiClient apiClient,
}) {
  return ProviderScope(
    overrides: [
      authProvider.overrideWith(() => TestAuthNotifier(user)),
      apiClientProvider.overrideWithValue(apiClient),
    ],
    child: MaterialApp(
      locale: const Locale('en'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: const Scaffold(
        body: SalesWorkCenterScreen(),
      ),
    ),
  );
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({'worker_ui_language': 'en'});
  });

  testWidgets('Salesperson only sees personal commission tier and NO leaderboard', (tester) async {
    const salesperson = UserProfile(
      id: 'sp-1',
      fullName: 'Ahmad Sales',
      employeeNumber: 'EMP-001',
      roles: ['SALESPERSON'],
      permissions: [],
      storeId: 'store-1',
      storeName: 'Central Showroom',
    );

    final mockDio = MockDioClient(
      personalTierData: {
        'salespersonId': 'sp-1',
        'salespersonName': 'Ahmad Sales',
        'confirmedOrdersCount': 5,
        'totalSalesVolume': 45000000.0,
        'estimatedCommission': 675000.0,
        'currentTierName': 'Silver',
        'currentTierColor': '#C0C0C0',
        'currentCommissionRate': 0.015,
        'nextTierName': 'Gold',
        'volumeNeededForNextTier': 15000000.0,
        'progressPercentage': 50.0,
      },
      teamLeaderboardData: [
        {
          'salespersonId': 'sp-2',
          'salespersonName': 'Top Seller',
          'confirmedOrdersCount': 12,
          'totalSalesVolume': 120000000.0,
          'tierName': 'Platinum',
        },
      ],
    );

    await tester.pumpWidget(createTestApp(
      user: salesperson,
      apiClient: TestApiClient(mockDio),
    ));
    await tester.pumpAndSettle();

    // Verify personal tier badge and volume
    expect(find.text('SILVER'), findsOneWidget);
    expect(find.textContaining('Volume: Rp'), findsOneWidget);
    expect(find.textContaining('Rate: 1.5%'), findsOneWidget);
    expect(find.textContaining('Next: Gold'), findsOneWidget);

    // Verify STRICTLY NO showroom leaderboard visible
    expect(find.text('Showroom Leaderboard (SPV View)'), findsNothing);
    expect(find.text('Top Seller'), findsNothing);
  });

  testWidgets('SPV sees personal card AND can expand Showroom Leaderboard', (tester) async {
    const spvUser = UserProfile(
      id: 'spv-1',
      fullName: 'Budi Supervisor',
      employeeNumber: 'EMP-002',
      roles: ['SPV'],
      permissions: [],
      storeId: 'store-1',
      storeName: 'Central Showroom',
    );

    final mockDio = MockDioClient(
      personalTierData: {
        'salespersonId': 'spv-1',
        'salespersonName': 'Budi Supervisor',
        'confirmedOrdersCount': 2,
        'totalSalesVolume': 20000000.0,
        'estimatedCommission': 200000.0,
        'currentTierName': 'Bronze',
        'currentTierColor': '#CD7F32',
        'currentCommissionRate': 0.01,
        'nextTierName': 'Silver',
        'volumeNeededForNextTier': 10000000.0,
        'progressPercentage': 66.7,
      },
      teamLeaderboardData: [
        {
          'salespersonId': 'sp-2',
          'salespersonName': 'Top Seller Dian',
          'confirmedOrdersCount': 10,
          'totalSalesVolume': 95000000.0,
          'tierName': 'Gold',
          'tierColor': '#FFD700',
        },
      ],
    );

    await tester.pumpWidget(createTestApp(
      user: spvUser,
      apiClient: TestApiClient(mockDio),
    ));
    await tester.pumpAndSettle();

    // SPV sees personal card
    expect(find.text('BRONZE'), findsOneWidget);

    // SPV sees Showroom Leaderboard ExpansionTile
    expect(find.text('Showroom Leaderboard (SPV View)'), findsOneWidget);

    // Expand the leaderboard
    await tester.tap(find.text('Showroom Leaderboard (SPV View)'));
    await tester.pumpAndSettle();

    // Leaderboard entries now visible to SPV
    expect(find.text('Top Seller Dian'), findsOneWidget);
    expect(find.text('Gold'), findsOneWidget);
  });
}
