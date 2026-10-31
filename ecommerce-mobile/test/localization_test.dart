import 'package:dio/dio.dart';
import 'package:ecommerce_mobile/core/app_text.dart';
import 'package:ecommerce_mobile/core/currency_formatter.dart';
import 'package:ecommerce_mobile/core/locale_provider.dart';
import 'package:ecommerce_mobile/core/localized_errors.dart';
import 'package:ecommerce_mobile/core/notification_text.dart';
import 'package:ecommerce_mobile/main.dart';
import 'package:ecommerce_mobile/models/delivery_schedule_model.dart';
import 'package:ecommerce_mobile/models/notification_model.dart';
import 'package:ecommerce_mobile/providers/auth_provider.dart';
import 'package:ecommerce_mobile/providers/cart_provider.dart';
import 'package:ecommerce_mobile/providers/catalog_provider.dart';
import 'package:ecommerce_mobile/providers/notification_provider.dart';
import 'package:ecommerce_mobile/providers/wishlist_provider.dart';
import 'package:ecommerce_mobile/screens/auth_screen.dart';
import 'package:ecommerce_mobile/widgets/delivery_reschedule_panel.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'auth_test.dart' as auth_fixture;
import 'delivery_reschedule_test.dart' as schedule_fixture;
import 'storefront_style_test.dart' as storefront_fixture;

class LocaleTestHost extends ConsumerWidget {
  const LocaleTestHost({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp(
    locale: ref.watch(localeProvider),
    supportedLocales: const [Locale('id'), Locale('en')],
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    home: child,
  );
}

Future<void> switchLanguage(WidgetTester tester, String label) async {
  await tester.tap(find.byKey(const Key('language-switcher')).first);
  await tester.pumpAndSettle();
  await tester.tap(find.text(label).last);
  await tester.pumpAndSettle();
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test(
    'Indonesian default, valid preference restoration and persisted choice',
    () async {
      final first = ProviderContainer();
      addTearDown(first.dispose);
      expect(first.read(localeProvider), const Locale('id'));
      await first.read(localeProvider.notifier).loaded;
      await first.read(localeProvider.notifier).select('en');
      expect(
        (await SharedPreferences.getInstance()).getString(localePreferenceKey),
        'en',
      );
      final second = ProviderContainer();
      addTearDown(second.dispose);
      second.read(localeProvider);
      await second.read(localeProvider.notifier).loaded;
      expect(second.read(localeProvider), const Locale('en'));
    },
  );

  test(
    'invalid saved preference defaults to Indonesian and latest selection wins',
    () async {
      SharedPreferences.setMockInitialValues({
        localePreferenceKey: 'unsupported',
      });
      final container = ProviderContainer();
      addTearDown(container.dispose);
      container.read(localeProvider);
      final controller = container.read(localeProvider.notifier);
      await controller.loaded;
      expect(container.read(localeProvider), const Locale('id'));
      final en = controller.select('en');
      final id = controller.select('id');
      await Future.wait([en, id]);
      expect(container.read(localeProvider), const Locale('id'));
      expect(
        (await SharedPreferences.getInstance()).getString(localePreferenceKey),
        'id',
      );
    },
  );

  test(
    'preference errors keep usable Indonesian default and selected language',
    () async {
      final container = ProviderContainer(
        overrides: [
          localePreferencesProvider.overrideWith(
            (ref) =>
                () => Future.error(StateError('Storage unavailable')),
          ),
        ],
      );
      addTearDown(container.dispose);
      container.read(localeProvider);
      final controller = container.read(localeProvider.notifier);
      await controller.loaded;
      expect(container.read(localeProvider), const Locale('id'));
      expect(container.read(localeErrorProvider), 'load');
      await controller.select('en');
      expect(container.read(localeProvider), const Locale('en'));
      expect(container.read(localeErrorProvider), 'save');
    },
  );

  test(
    'selection beats initial load and storage retry clears its warning',
    () async {
      SharedPreferences.setMockInitialValues({localePreferenceKey: 'id'});
      final first = ProviderContainer();
      addTearDown(first.dispose);
      first.read(localeProvider);
      final select = first.read(localeProvider.notifier).select('en');
      await first.read(localeProvider.notifier).loaded;
      await select;
      expect(first.read(localeProvider), const Locale('en'));
      var unavailable = true;
      final second = ProviderContainer(
        overrides: [
          localePreferencesProvider.overrideWith(
            (ref) =>
                () => unavailable
                ? Future.error(StateError('Storage unavailable'))
                : SharedPreferences.getInstance(),
          ),
        ],
      );
      addTearDown(second.dispose);
      second.read(localeProvider);
      await second.read(localeProvider.notifier).loaded;
      expect(second.read(localeErrorProvider), 'load');
      unavailable = false;
      await second.read(localeProvider.notifier).select('en');
      expect(second.read(localeErrorProvider), isNull);
      expect(second.read(localeProvider), const Locale('en'));
    },
  );

  testWidgets(
    'global switch preserves selected navigation and authentication',
    (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith(() => schedule_fixture.CustomerAuth()),
            cartProvider.overrideWith(storefront_fixture.TestCartNotifier.new),
            notificationsProvider.overrideWith(
              storefront_fixture.TestNotificationNotifier.new,
            ),
            wishlistProvider.overrideWith(
              storefront_fixture.TestWishlistNotifier.new,
            ),
            featuredProductsProvider.overrideWith((ref) async => []),
            productsProvider.overrideWith((ref) async => []),
          ],
          child: const SmsStorefrontApp(),
        ),
      );

      await tester.pumpAndSettle();
      await tester.tap(find.text('Akun').last);
      await tester.pumpAndSettle();
      final container = ProviderScope.containerOf(
        tester.element(find.byType(SmsStorefrontApp)),
      );
      final user = container.read(authProvider).value;
      await switchLanguage(tester, 'English');
      expect(find.text('My Account'), findsOneWidget);
      expect(
        tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex,
        4,
      );
      expect(container.read(authProvider).value, same(user));
      await switchLanguage(tester, 'Bahasa Indonesia');
      expect(find.text('Akun Saya'), findsOneWidget);
      expect(
        tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex,
        4,
      );
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('login switch keeps route, email, OTP and localized validation', (
    tester,
  ) async {
    final notifier = auth_fixture.TestAuthNotifier();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authProvider.overrideWith(() => notifier)],
        child: LocaleTestHost(
          child: Builder(
            builder: (context) => Scaffold(
              body: FilledButton(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute<void>(builder: (_) => const AuthScreen()),
                ),
                child: const Text('Open'),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byType(TextFormField).first,
      'customer@example.test',
    );
    await tester.tap(find.text('Kirim Kode OTP'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).last, '123456');
    await switchLanguage(tester, 'English');
    expect(find.text('Verify & Sign In'), findsOneWidget);
    expect(
      find.textContaining('Code sent to customer@example.test'),
      findsOneWidget,
    );
    expect(
      tester
          .widget<TextFormField>(find.byType(TextFormField).last)
          .controller!
          .text,
      '123456',
    );
    expect(notifier.verifiedCode, isNull);
    await tester.enterText(find.byType(TextFormField).last, '123');
    await tester.ensureVisible(find.text('Verify & Sign In'));
    await tester.tap(find.text('Verify & Sign In'));
    await tester.pumpAndSettle();
    expect(find.text('Enter the OTP code from your email.'), findsOneWidget);
    await switchLanguage(tester, 'Bahasa Indonesia');
    expect(find.text('Verifikasi & Masuk'), findsOneWidget);
    expect(find.text('Masukkan kode OTP dari email.'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('English Q.33 history, date picker and canonical request codes', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({localePreferenceKey: 'en'});
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 1100);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final api = schedule_fixture.ScheduleApi();
    api.requests.addAll([
      DeliveryRescheduleRequest(
        id: 'old-1',
        requestedDate: '2026-11-03',
        requestedWindow: 'MORNING',
        status: 'APPROVED',
        decisionNotes: 'Catatan pelanggan',
      ),
      DeliveryRescheduleRequest(
        id: 'old-2',
        requestedDate: '2026-11-04',
        requestedWindow: 'AFTERNOON',
        status: 'REJECTED',
      ),
    ]);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(() => schedule_fixture.CustomerAuth()),
          apiClientProvider.overrideWithValue(api),
        ],
        child: const LocaleTestHost(
          child: Scaffold(
            body: SingleChildScrollView(
              child: DeliveryReschedulePanel(orderId: 'order-1'),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('Approved — Catatan pelanggan'), findsOneWidget);
    expect(find.textContaining('Rejected'), findsOneWidget);
    expect(
      find.textContaining('Planned dispatch: Nov 5, 2026 09:00 WIB'),
      findsOneWidget,
    );
    await tester.tap(find.text('Choose a new delivery date'));
    await tester.pumpAndSettle();
    final pickerContext = tester.element(find.byType(DatePickerDialog));
    expect(Localizations.localeOf(pickerContext).languageCode, 'en');
    expect(MaterialLocalizations.of(pickerContext).cancelButtonLabel, 'Cancel');
    await tester.tap(
      find.text(MaterialLocalizations.of(pickerContext).okButtonLabel),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Morning · 09:00–12:00'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Afternoon · 12:00–17:00').last);
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Request reschedule'));
    await tester.tap(find.text('Request reschedule'));
    await tester.pumpAndSettle();
    expect(api.window, 'AFTERNOON');
    expect(api.date, matches(r'^\d{4}-\d{2}-\d{2}$'));
    expect(find.textContaining('Pending approval'), findsOneWidget);
    expect(find.textContaining('Schedule: Nov 5, 2026'), findsOneWidget);
    expect(find.textContaining('schedule remains unchanged'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'locale-sensitive IDR, business errors and notifications preserve data',
    (tester) async {
      SharedPreferences.setMockInitialValues({localePreferenceKey: 'en'});
      late BuildContext localeContext;
      await tester.pumpWidget(
        ProviderScope(
          child: LocaleTestHost(
            child: Builder(
              builder: (context) {
                localeContext = context;
                return const Scaffold();
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(
        CurrencyFormatter.format(15000000, localeContext),
        'Rp 15,000,000',
      );
      expect(CurrencyFormatter.format(15000000), 'Rp 15.000.000');
      expect(formatDecimal(localeContext, 2.5, 1), '2.5');
      final item = NotificationItem(
        id: 'n',
        orderNumber: 'SO-CUSTOMER',
        milestoneType: 'STORE_PICKUP_READY',
        title: 'Pesanan Siap Diambil di Cabang 🏬',
        body: '',
        status: 'SENT',
        isRead: false,
        sentAt: DateTime.now(),
        payloadData: '{"pickupStoreName":"Toko Pelanggan"}',
      );
      expect(notificationBody(localeContext, item), contains('Toko Pelanggan'));
      expect(notificationTitle(localeContext, item), contains('Ready'));
      final custom = NotificationItem(
        id: 'custom',
        orderNumber: 'SO-CUSTOMER',
        milestoneType: 'STORE_PICKUP_READY',
        title: 'Customer-authored announcement',
        body: 'Catatan pelanggan tidak diterjemahkan',
        status: 'SENT',
        isRead: false,
        sentAt: DateTime.now(),
      );
      expect(notificationTitle(localeContext, custom), custom.title);
      expect(notificationBody(localeContext, custom), custom.body);
      final error = DioException(
        requestOptions: RequestOptions(),
        response: Response(
          requestOptions: RequestOptions(),
          data: {
            'message':
                'Reschedule requests close 24 hours before planned dispatch',
          },
        ),
      );
      expect(
        localError(null, error),
        'Permintaan perubahan jadwal ditutup 24 jam sebelum rencana berangkat.',
      );
      expect(
        localError(localeContext, error),
        'Reschedule requests close 24 hours before planned dispatch',
      );
      expect(
        localError(localeContext, 'Unknown detail: Customer ABC'),
        'Unknown detail: Customer ABC',
      );
      expect(
        localError(null, 'Unknown detail: Customer ABC'),
        'Unknown detail: Customer ABC',
      );
      expect(
        localError(null, 'Variant not found: Customer SKU'),
        'Varian tidak ditemukan: Customer SKU',
      );
      expect(
        localError(localeContext, 'Variant not found: Customer SKU'),
        'Variant not found: Customer SKU',
      );
    },
  );
}
