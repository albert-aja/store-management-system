import 'package:flutter/material.dart';
import 'package:sms_mobile/l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms_mobile/core/models/user_profile.dart';
import 'package:sms_mobile/features/auth/providers/auth_provider.dart';
import 'package:sms_mobile/features/sales/screens/credit_calculator_screen.dart';
import 'package:sms_mobile/features/sales/screens/sales_work_center_screen.dart';
import 'package:sms_mobile/features/sales/services/credit_calculator_service.dart';

const testSalesUser = UserProfile(
  id: 'sales-001',
  fullName: 'Sales Person',
  employeeNumber: 'EMP-007',
  storeId: 'store-001',
  storeName: 'Showroom Pusat',
  roles: ['SALESPERSON'],
  permissions: [],
);

class FakeSalesAuthNotifier extends AuthNotifier {
  @override
  AuthState build() {
    return const AuthState(user: testSalesUser);
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({'worker_ui_language': 'en'});
  });

  Widget createTestWidget(Widget child) {
    return ProviderScope(
      overrides: [authProvider.overrideWith(() => FakeSalesAuthNotifier())],
      child: MaterialApp(
        locale: const Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: child,
      ),
    );
  }

  group('CreditCalculatorService Retail Formula Verification', () {
    test('Determines suggested DP according to standard retail brackets', () {
      expect(CreditCalculatorService.getSuggestedDp(4500000), 0.0);
      expect(CreditCalculatorService.getSuggestedDp(5500000), 1000000.0);
      expect(CreditCalculatorService.getSuggestedDp(6500000), 1500000.0);
      expect(CreditCalculatorService.getSuggestedDp(7500000), 2000000.0);
      expect(CreditCalculatorService.getSuggestedDp(8500000), 2500000.0);
    });

    test(
      'Accurately calculates installment for standard price list (Zero DP, HD=2.878.000, 10 mo)',
      () {
        final result = CreditCalculatorService.calculateTerm(
          hargaDasar: 2878000,
          downPayment: 0,
          termMonths: 10,
        );

        // Verified formula:
        // h1 = (2878 - 0) + 30 = 2908
        // h2 = 2908 * 1.4 = 4071.2
        // h3 = 4071.2 / 10 = 407.12
        // h4 = 407.12 * 0.85 = 346.052
        // Round(346.052 / 5) * 5 + 5 = 69 * 5 + 5 = 350 -> Rp 350.000
        expect(result.monthlyInstallment, 350000.0);
        expect(result.totalPrice, 3500000.0);
        expect(result.totalCustomerCost, 3500000.0);
      },
    );

    test(
      'Accurately calculates buyer suggested condition (10% DP on HD=4.500.000, 10 mo)',
      () {
        final result = CreditCalculatorService.calculateTerm(
          hargaDasar: 4500000,
          downPayment: 450000, // 10% DP
          termMonths: 10,
        );

        // Verified formula:
        // h1 = (4500 - 450) + 30 = 4080
        // h2 = 4080 * 1.4 = 5712
        // h3 = 5712 / 10 = 571.2
        // h4 = 571.2 * 0.85 = 485.52
        // Round(485.52 / 5) * 5 + 5 = 97 * 5 + 5 = 490 -> Rp 490.000
        expect(result.monthlyInstallment, 490000.0);
        expect(result.totalPrice, 4900000.0);
        expect(result.totalCustomerCost, 5350000.0);
        expect(result.monthlyDiscountSaved, greaterThan(0));
      },
    );

    test(
      'Simulates multi-tenors and formats clean WhatsApp sharing quotation',
      () {
        final sim = CreditCalculatorService.simulate(
          hargaDasar: 4500000,
          downPayment: 450000,
          terms: [6, 10, 12, 15],
        );

        expect(sim.terms.length, 4);
        expect(sim.dpPercentage, 10.0);
        expect(sim.isAutoDp, false);

        final shareText = CreditCalculatorService.generateShareSummary(
          productName: 'Smart TV 43 Inch',
          simulation: sim,
        );

        expect(shareText, contains('SIMULASI KREDIT TOKO SMS'));
        expect(shareText, contains('Smart TV 43 Inch'));
        expect(shareText, contains('Rp 4.500.000'));
        expect(shareText, contains('*Rp 450.000* (10%)'));
        expect(shareText, contains('*10 Bulan*: Rp 490.000 / bln'));
      },
    );
  });

  group('Credit Calculator Widget Tests', () {
    testWidgets(
      'Renders calculator screen with multi-tenor simulation and DP chips',
      (tester) async {
        tester.view.physicalSize = const Size(800, 1200);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);

        await tester.pumpWidget(
          createTestWidget(
            const CreditCalculatorScreen(
              initialPrice: 4500000,
              initialProductName: 'Samsung 43 Inch UHD',
            ),
          ),
        );
        await tester.pumpAndSettle();

        expect(find.text('Credit Calculator & Simulation'), findsOneWidget);
        expect(find.textContaining('Down Payment'), findsWidgets);
        expect(find.text('Percentage (%)'), findsOneWidget);

        // Tap percentage mode
        await tester.tap(find.text('Percentage (%)'));
        await tester.pumpAndSettle();

        expect(find.text('10%'), findsOneWidget);
        expect(find.text('20%'), findsOneWidget);
      },
    );

    testWidgets(
      'SalesWorkCenterScreen includes Kalkulator & Simulasi Kredit banner',
      (tester) async {
        await tester.pumpWidget(
          createTestWidget(const SalesWorkCenterScreen()),
        );
        await tester.pumpAndSettle();

        expect(find.text('Credit Calculator & Simulation'), findsOneWidget);
        expect(find.text('Open'), findsOneWidget);
      },
    );
  });
}
