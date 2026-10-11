import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:sms_mobile/main.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Worker App renders Login screen and allows role selection',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: SmsWorkerApp(),
      ),
    );

    // Initial load: redirects to Login
    await tester.pumpAndSettle();

    // Verify presence of title & subtitle
    expect(find.text('SMS Worker App'), findsOneWidget);
    expect(
      find.text('Field operations, tasks, attendance & personal records'),
      findsOneWidget,
    );

    // Verify role chips
    expect(find.text('Driver'), findsOneWidget);
    expect(find.text('Surveyor'), findsOneWidget);
    expect(find.text('Collector'), findsOneWidget);
    expect(find.text('Salesperson'), findsOneWidget);
    expect(find.text('Manager'), findsOneWidget);
    expect(find.text('Helper'), findsOneWidget);

    // Tap on Surveyor chip
    await tester.tap(find.text('Surveyor'));
    await tester.pumpAndSettle();

    // Tap Sign In button
    final signInButton = find.text('Sign In to Worker Workspace');
    expect(signInButton, findsOneWidget);
    await tester.tap(signInButton);
    await tester.pumpAndSettle();

    // Should navigate to Worker Home Screen with Surveyor badge
    expect(find.widgetWithText(Chip, 'SURVEYOR'), findsOneWidget);
    expect(find.text('Daily Attendance'), findsOneWidget);
    expect(find.text('Credit Surveys Queue'), findsOneWidget);
  });
}
