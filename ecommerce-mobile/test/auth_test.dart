import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ecommerce_mobile/models/customer_profile.dart';
import 'package:ecommerce_mobile/providers/auth_provider.dart';
import 'package:ecommerce_mobile/screens/auth_screen.dart';
import 'package:ecommerce_mobile/screens/profile_screen.dart';

class TestAuthNotifier extends AuthNotifier {
  String? sentEmail;
  String? verifiedCode;
  bool googleStarted = false;
  bool rejectCode = false;

  @override
  Future<CustomerProfile?> build() async => null;

  @override
  Future<void> sendEmailOtp(String email) async {
    sentEmail = email;
  }

  @override
  Future<void> verifyEmailOtp(String email, String token) async {
    if (rejectCode) throw StateError('Token has expired or is invalid');
    verifiedCode = token;
    state = AsyncData(
      CustomerProfile(
        customerId: 'db-uuid',
        email: email,
        fullName: 'Customer',
      ),
    );
  }

  @override
  Future<void> loginWithGoogle() async {
    googleStarted = true;
  }
}

Future<void> openAuth(WidgetTester tester, TestAuthNotifier notifier) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [authProvider.overrideWith(() => notifier)],
      child: MaterialApp(
        locale: const Locale('id'),
        supportedLocales: const [Locale('id'), Locale('en')],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        home: Builder(
          builder: (context) => Scaffold(
            body: TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AuthScreen()),
              ),
              child: const Text('Open login'),
            ),
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
  await tester.tap(find.text('Open login'));
  await tester.pumpAndSettle();
}

void main() {
  test('Profile response supports customers without phone numbers', () {
    final profile = CustomerProfile.fromJson({
      'customerId': 'db-uuid',
      'email': 'customer@example.com',
      'fullName': 'Customer',
      'phone': null,
    });
    expect(profile.phone, isNull);
    expect(profile.customerId, 'db-uuid');
  });

  testWidgets('Email OTP sign-in requires code before returning to account', (
    tester,
  ) async {
    final notifier = TestAuthNotifier();
    await openAuth(tester, notifier);
    await tester.enterText(
      find.byType(TextFormField).first,
      'customer@example.com',
    );
    await tester.tap(find.text('Kirim Kode OTP'));
    await tester.pumpAndSettle();
    expect(notifier.sentEmail, 'customer@example.com');
    expect(find.text('Verifikasi & Masuk'), findsOneWidget);
    expect(find.text('Kirim ulang (60s)'), findsOneWidget);
    await tester.enterText(find.byType(TextFormField).last, '123456');
    await tester.ensureVisible(find.text('Verifikasi & Masuk'));
    await tester.tap(find.text('Verifikasi & Masuk'));
    await tester.pumpAndSettle();
    expect(notifier.verifiedCode, '123456');
    expect(find.text('Open login'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Wrong or expired OTP shows error and stays on login', (
    tester,
  ) async {
    final notifier = TestAuthNotifier()..rejectCode = true;
    await openAuth(tester, notifier);
    await tester.enterText(
      find.byType(TextFormField).first,
      'customer@example.com',
    );
    await tester.tap(find.text('Kirim Kode OTP'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).last, '000000');
    await tester.ensureVisible(find.text('Verifikasi & Masuk'));
    await tester.tap(find.text('Verifikasi & Masuk'));
    await tester.pumpAndSettle();
    expect(
      find.text('Kode kedaluwarsa atau tidak valid. Kirim ulang kode.'),
      findsOneWidget,
    );
    expect(find.text('Masuk ke SMS Mart'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Google login starts provider flow without fake authentication', (
    tester,
  ) async {
    final notifier = TestAuthNotifier();
    await openAuth(tester, notifier);
    await tester.tap(find.text('Lanjutkan dengan Google'));
    await tester.pumpAndSettle();
    expect(notifier.googleStarted, isTrue);
    expect(find.text('Masuk ke SMS Mart'), findsOneWidget);
  });

  testWidgets('Guest profile exposes login instead of hardcoded customer', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authProvider.overrideWith(TestAuthNotifier.new)],
        child: const MaterialApp(
          locale: Locale('id'),
          supportedLocales: [Locale('id'), Locale('en')],
          localizationsDelegates: GlobalMaterialLocalizations.delegates,
          home: ProfileScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Belum masuk'), findsOneWidget);
    expect(find.text('Masuk / Daftar'), findsOneWidget);
    expect(find.text('Budi Santoso'), findsNothing);
  });
}
