import '../core/app_text.dart';
import '../core/localized_errors.dart';
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/app_theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/language_switcher.dart';

String loginErrorMessage(Object error, {BuildContext? context}) {
  if (error is AuthException) return localError(context, error);
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['message'] is String) {
      return localError(context, error);
    }
    return AppText.unableToContactTheSignIn(context);
  }
  if (error is StateError) return localError(context, error);
  return AppText.signInFailedPleaseTryAgain(context);
}

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _code = TextEditingController();
  String? _sentTo;
  Object? _error;
  bool _busy = false;
  int _remaining = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _email.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } catch (error) {
      if (mounted) setState(() => _error = error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _sendCode() async {
    final target = _sentTo ?? _email.text.trim();
    await ref.read(authProvider.notifier).sendEmailOtp(target);
    if (!mounted) return;
    _code.clear();
    setState(() {
      _sentTo = target;
      _remaining = 60;
    });
    _timer?.cancel();
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (!mounted || _remaining <= 1) timer.cancel();
      if (mounted) setState(() => _remaining = (_remaining - 1).clamp(0, 60));
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    ref.listen(authProvider, (_, next) {
      if (next.hasValue && next.value != null) Navigator.of(context).pop();
    });
    final disabled = _busy || auth.isLoading;
    final error = _error != null
        ? loginErrorMessage(_error!, context: context)
        : (auth.hasError
              ? loginErrorMessage(auth.error!, context: context)
              : null);
    final form = Form(
      key: _formKey,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (error != null) ...[
            Text(
              error,
              style: TextStyle(color: Colors.red),
              key: Key('auth-error'),
            ),
            SizedBox(height: 16),
          ],
          OutlinedButton(
            onPressed: disabled
                ? null
                : () => _run(ref.read(authProvider.notifier).loginWithGoogle),
            child: Text(AppText.continueWithGoogle(context)),
          ),
          Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Text(
              AppText.orUseEmail(context),
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: AppTheme.mutedText),
            ),
          ),
          TextFormField(
            controller: _email,
            enabled: _sentTo == null && !disabled,
            keyboardType: TextInputType.emailAddress,
            autofillHints: [AutofillHints.email],
            decoration: InputDecoration(
              labelText: AppText.emailAddress(context),
              prefixIcon: Icon(Icons.mail_outline, size: 20),
            ),
            validator: (value) =>
                value != null &&
                    RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value.trim())
                ? null
                : AppText.enterAValidEmailAddress(context),
          ),
          if (_sentTo != null) ...[
            SizedBox(height: 16),
            Text(
              AppText.codeSentToCheckYourInbox(context, _sentTo),
              style: TextStyle(fontSize: 12, color: AppTheme.mutedText),
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: _code,
              enabled: !disabled,
              keyboardType: TextInputType.number,
              autofillHints: [AutofillHints.oneTimeCode],
              maxLength: 10,
              decoration: InputDecoration(labelText: AppText.otpCode(context)),
              validator: (value) =>
                  value != null &&
                      RegExp(r'^[0-9]{6,10}$').hasMatch(value.trim())
                  ? null
                  : AppText.enterTheOtpCodeFromYour(context),
            ),
          ],
          SizedBox(height: 20),
          FilledButton(
            onPressed: disabled
                ? null
                : () {
                    if (!_formKey.currentState!.validate()) return;
                    _run(
                      _sentTo == null
                          ? _sendCode
                          : () => ref
                                .read(authProvider.notifier)
                                .verifyEmailOtp(_sentTo!, _code.text),
                    );
                  },
            child: Text(
              disabled
                  ? AppText.processing(context)
                  : _sentTo == null
                  ? AppText.sendOtpCode(context)
                  : AppText.verifySignIn(context),
            ),
          ),
          if (_sentTo != null)
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: disabled || _remaining > 0
                      ? null
                      : () => _run(_sendCode),
                  child: Text(
                    _remaining > 0
                        ? AppText.resendS(context, _remaining)
                        : AppText.resendCode(context),
                  ),
                ),
                TextButton(
                  onPressed: disabled
                      ? null
                      : () {
                          _timer?.cancel();
                          setState(() {
                            _sentTo = null;
                            _error = null;
                            _code.clear();
                          });
                        },
                  child: Text(AppText.changeEmail(context)),
                ),
              ],
            ),
          SizedBox(height: 20),
          Text(
            AppText.yourEmailIsVerifiedBeforeYour(context),
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: AppTheme.mutedText),
          ),
        ],
      ),
    );
    return Scaffold(
      appBar: AppBar(
        title: Text(AppText.account(context)),
        actions: const [LanguageSwitcher()],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: 448),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppTheme.primarySky,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.storefront,
                      size: 24,
                      color: Colors.white,
                    ),
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  AppText.signInToSmsMart(context),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                SizedBox(height: 8),
                Text(
                  AppText.signInOrRegisterWithGoogle(context),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.mutedText),
                ),
                SizedBox(height: 24),
                Card(
                  child: Padding(padding: EdgeInsets.all(24), child: form),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
