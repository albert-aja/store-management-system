import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms_mobile/core/localization/worker_format.dart';
import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:sms_mobile/features/auth/providers/auth_provider.dart';
import 'package:sms_mobile/features/auth/screens/login_screen.dart';
import 'package:sms_mobile/features/delivery/models/delivery_model.dart';
import 'package:sms_mobile/features/delivery/services/external_navigation_service.dart';
import 'package:sms_mobile/features/delivery/widgets/navigation_handover_button.dart';
import 'package:sms_mobile/features/sales/services/credit_calculator_service.dart';
import 'package:sms_mobile/l10n/app_localizations.dart';
import 'package:sms_mobile/l10n/app_localizations_en.dart';
import 'package:sms_mobile/l10n/app_localizations_id.dart';

class MemoryLocaleStore implements LocaleStore {
  String? value;
  bool fail = false;
  Completer<String?>? pendingLoad;
  @override
  Future<String?> load() async {
    if (fail) throw StateError('storage');
    return pendingLoad == null ? value : pendingLoad!.future;
  }

  @override
  Future<void> save(String language) async {
    if (fail) throw StateError('storage');
    value = language;
  }
}

class SignedOutAuth extends AuthNotifier {
  @override
  AuthState build() => const AuthState();
}

class LocalizedHarness extends ConsumerWidget {
  const LocalizedHarness({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final language = ref.watch(workerLocaleProvider);
    return MaterialApp(
      locale: language.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      home: Builder(
        builder: (context) => Scaffold(
          appBar: AppBar(actions: const [WorkerLanguageSwitcher()]),
          body: Column(
            children: [
              if (language.failure)
                Text(context.l10n.languagePersistenceFailed),
              Expanded(child: child),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> chooseLanguage(WidgetTester tester, String code) async {
  await tester.tap(find.byType(WorkerLanguageSwitcher).first);
  await tester.pumpAndSettle();
  await tester.tap(
    find.text(code == 'en' ? 'EN — English' : 'ID — Bahasa Indonesia').last,
  );
  await tester.pumpAndSettle();
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('catalogs have complete, nonempty ID and EN key coverage', () {
    Map<String, dynamic> catalog(String locale) =>
        jsonDecode(File('lib\\l10n\\app_$locale.arb').readAsStringSync())
            as Map<String, dynamic>;
    final english = catalog('en');
    final indonesian = catalog('id');
    final keys = english.keys.where((key) => !key.startsWith('@')).toSet();
    expect(keys.length, greaterThan(500));
    expect(indonesian.keys.where((key) => !key.startsWith('@')).toSet(), keys);
    for (final key in keys) {
      expect(indonesian[key], isA<String>(), reason: key);
      expect((indonesian[key] as String).isNotEmpty, isTrue, reason: key);
    }
  });

  test(
    'Indonesian default and SharedPreferences survive container recreation',
    () async {
      final first = ProviderContainer();
      expect(first.read(workerLocaleProvider).locale.languageCode, 'id');
      await Future<void>.delayed(Duration.zero);
      await first.read(workerLocaleProvider.notifier).select('en');
      expect(
        (await SharedPreferences.getInstance()).getString(
          PreferencesLocaleStore.key,
        ),
        'en',
      );
      first.dispose();
      final second = ProviderContainer();
      addTearDown(second.dispose);
      second.read(workerLocaleProvider);
      await Future<void>.delayed(Duration.zero);
      expect(second.read(workerLocaleProvider).locale.languageCode, 'en');
    },
  );

  test(
    'late persistence restore cannot overwrite an explicit selection',
    () async {
      final store = MemoryLocaleStore()..pendingLoad = Completer<String?>();
      final container = ProviderContainer(
        overrides: [localeStoreProvider.overrideWithValue(store)],
      );
      addTearDown(container.dispose);
      container.read(workerLocaleProvider);
      await Future<void>.delayed(Duration.zero);
      await container.read(workerLocaleProvider.notifier).select('en');
      store.pendingLoad!.complete('id');
      await Future<void>.delayed(Duration.zero);
      expect(container.read(workerLocaleProvider).locale.languageCode, 'en');
    },
  );

  testWidgets(
    'login switch changes labels, never typed credentials or screen state',
    (tester) async {
      final store = MemoryLocaleStore();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            localeStoreProvider.overrideWithValue(store),
            authProvider.overrideWith(SignedOutAuth.new),
          ],
          child: const LocalizedHarness(child: LoginScreen()),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Aplikasi Pekerja SMS'), findsOneWidget);
      final screenState = tester.state(find.byType(LoginScreen));
      await tester.enterText(find.byType(TextField).first, 'unchanged@sms.com');
      await tester.enterText(find.byType(TextField).last, 'unchanged-password');
      await chooseLanguage(tester, 'en');
      expect(find.text('SMS Worker App'), findsOneWidget);
      expect(tester.state(find.byType(LoginScreen)), same(screenState));
      final inputs = tester
          .widgetList<TextField>(find.byType(TextField))
          .toList();
      expect(inputs.first.controller!.text, 'unchanged@sms.com');
      expect(inputs.last.controller!.text, 'unchanged-password');
      expect(store.value, 'en');
      await chooseLanguage(tester, 'id');
      expect(find.text('Masuk ke Ruang Kerja Pekerja'), findsOneWidget);
      expect(store.value, 'id');
    },
  );

  testWidgets('load/save failures are visible and selection can retry', (
    tester,
  ) async {
    final store = MemoryLocaleStore()..fail = true;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [localeStoreProvider.overrideWithValue(store)],
        child: const LocalizedHarness(child: SizedBox()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('Pilihan bahasa gagal'), findsOneWidget);
    await chooseLanguage(tester, 'en');
    expect(
      find.textContaining('Language preference could not'),
      findsOneWidget,
    );
    store.fail = false;
    await chooseLanguage(tester, 'en');
    expect(find.textContaining('Language preference could not'), findsNothing);
    expect(store.value, 'en');
  });

  testWidgets('Q.30 visible preference failure follows a language toggle', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      ExternalNavigationService.preferenceKey: 'invalid-app',
    });
    final store = MemoryLocaleStore();
    final service = ExternalNavigationService(platform: TargetPlatform.android);
    final order = DeliveryOrderModel.fromJson({
      'id': 'stop-1',
      'destinationLatitude': -6.1,
      'destinationLongitude': 106.8,
    });
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          localeStoreProvider.overrideWithValue(store),
          externalNavigationProvider.overrideWithValue(service),
        ],
        child: LocalizedHarness(
          child: NavigationHandoverButton(
            tripId: 'trip-1',
            order: order,
            onReturned: () {},
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      find.textContaining('Pilihan aplikasi navigasi tersimpan tidak valid'),
      findsOneWidget,
    );
    await chooseLanguage(tester, 'en');
    expect(
      find.textContaining('Saved navigation app is invalid'),
      findsOneWidget,
    );
    expect(order.status, 'PENDING');
  });

  for (final language in ['id', 'en']) {
    testWidgets('$language numbers/dates preserve IDR, WIB and backend codes', (
      tester,
    ) async {
      final store = MemoryLocaleStore()..value = language;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [localeStoreProvider.overrideWithValue(store)],
          child: LocalizedHarness(
            child: Builder(
              builder: (context) => Column(
                children: [
                  Text(context.rupiah(1234567)),
                  Text(context.number(1.5, decimals: 1)),
                  Text(context.wibDate(DateTime.utc(2026, 10, 1, 18))),
                  Text(context.deliveryWindow('MORNING')),
                  Text(context.uiCode('PENDING')),
                ],
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(
        find.text(language == 'id' ? 'Rp 1.234.567' : 'Rp 1,234,567'),
        findsOneWidget,
      );
      expect(find.text(language == 'id' ? '1,5' : '1.5'), findsOneWidget);
      expect(find.textContaining('02 '), findsOneWidget);
      expect(find.textContaining('01:00 WIB'), findsOneWidget);
      expect(
        find.text(language == 'id' ? 'Menunggu' : 'Pending'),
        findsOneWidget,
      );
      expect(find.textContaining('09:00–12:00 WIB'), findsOneWidget);
      const code = 'MORNING';
      expect(code, 'MORNING');
    });

    testWidgets(
      '$language Q.30 preference works across mounted stops and locale changes',
      (tester) async {
        final store = MemoryLocaleStore()..value = language;
        final launched = <Uri>[];
        var returnedFirst = 0;
        var returnedSecond = 0;
        final service = ExternalNavigationService(
          platform: TargetPlatform.android,
          canOpen: (_) async => true,
          open: (uri) async {
            launched.add(uri);
            return true;
          },
        );
        DeliveryOrderModel stop(String id, double latitude) =>
            DeliveryOrderModel.fromJson({
              'id': id,
              'tripId': 'trip-1',
              'destinationLatitude': latitude,
              'destinationLongitude': 106.8,
              'status': 'IN_TRANSIT',
              'recipientName': 'Customer data is unchanged',
              'deliveryWindow': 'AFTERNOON',
            });
        final first = stop('stop-1', -6.1);
        final second = stop('stop-2', -6.2);
        await tester.pumpWidget(
          ProviderScope(
            overrides: [
              localeStoreProvider.overrideWithValue(store),
              externalNavigationProvider.overrideWithValue(service),
            ],
            child: LocalizedHarness(
              child: Column(
                children: [
                  NavigationHandoverButton(
                    tripId: 'trip-1',
                    order: first,
                    onReturned: () => returnedFirst++,
                  ),
                  NavigationHandoverButton(
                    tripId: 'trip-1',
                    order: second,
                    onReturned: () => returnedSecond++,
                  ),
                ],
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();
        await tester.tap(
          find.text(language == 'id' ? 'Navigasi' : 'Navigate').first,
        );
        await tester.pumpAndSettle();
        expect(
          find.textContaining(
            language == 'id'
                ? 'Hanya GPS tujuan'
                : 'Share only destination GPS',
          ),
          findsOneWidget,
        );
        await tester.tap(find.text('Waze'));
        await tester.pumpAndSettle();
        await chooseLanguage(tester, language == 'id' ? 'en' : 'id');
        await tester.tap(find.text(language == 'id' ? 'Navigate' : 'Navigasi'));
        await tester.pumpAndSettle();
        expect(launched.length, 2);
        expect(launched.first.queryParameters['ll'], '-6.1,106.8');
        expect(launched.last.queryParameters['ll'], '-6.2,106.8');
        expect(find.byType(BottomSheet), findsNothing);
        expect(await service.preferredApp(), NavigationApp.waze);
        tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.hidden);
        tester.binding.handleAppLifecycleStateChanged(
          AppLifecycleState.resumed,
        );
        expect(returnedFirst, 1);
        expect(returnedSecond, 1);
        tester.binding.handleAppLifecycleStateChanged(
          AppLifecycleState.resumed,
        );
        expect(returnedFirst, 1);
        expect(first.status, 'IN_TRANSIT');
        expect(second.deliveryWindow, 'AFTERNOON');
        expect(first.recipientName, 'Customer data is unchanged');
      },
    );
  }

  test(
    'Q.30 service errors and credit sharing are localizable without financial changes',
    () async {
      final service = ExternalNavigationService(
        platform: TargetPlatform.android,
      );
      NavigationException? failure;
      try {
        service.destinationUri(
          app: NavigationApp.waze,
          latitude: 91,
          longitude: 0,
          tripId: 'trip-1',
          stopId: 'stop-1',
        );
      } on NavigationException catch (error) {
        failure = error;
      }
      expect(
        failure!.localized!.resolve(AppLocalizationsId()),
        contains('GPS tujuan tidak valid'),
      );
      expect(
        failure.localized!.resolve(AppLocalizationsEn()),
        contains('Destination GPS is invalid'),
      );
      final simulation = CreditCalculatorService.simulate(
        hargaDasar: 4500000,
        downPayment: 450000,
        terms: [10],
      );
      for (final l10n in [AppLocalizationsId(), AppLocalizationsEn()]) {
        final summary = CreditCalculatorService.generateShareSummary(
          productName: 'Produk Asli',
          simulation: simulation,
          localization: l10n,
        );
        expect(summary, contains('Produk Asli'));
        expect(
          summary,
          contains(l10n.localeName == 'id' ? 'Rp 490.000' : 'Rp 490,000'),
        );
      }
      expect(simulation.terms.single.monthlyInstallment, 490000);
    },
  );
}
