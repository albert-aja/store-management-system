import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/auth_config.dart';
import '../models/customer_profile.dart';
import 'catalog_provider.dart';

final supabaseClientProvider = Provider<SupabaseClient?>((ref) {
  return AuthConfig.isConfigured ? Supabase.instance.client : null;
});

class AuthNotifier extends AsyncNotifier<CustomerProfile?> {
  int _generation = 0;
  String? _activeSubject;

  SupabaseClient get _client =>
      ref.read(supabaseClientProvider) ??
      (throw StateError(
        'Login belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY.',
      ));

  @override
  Future<CustomerProfile?> build() async {
    final current = ++_generation;
    final client = ref.watch(supabaseClientProvider);
    _activeSubject = null;
    final api = ref.read(apiClientProvider);
    api.setAccessToken(null);
    if (client == null) return null;
    final subscription = client.auth.onAuthStateChange.listen(
      (event) {
        if (event.event != AuthChangeEvent.initialSession) {
          unawaited(_applySession(event.session));
        }
      },
      onError: (Object error, StackTrace stack) {
        _generation++;
        _activeSubject = null;
        api.setAccessToken(null);
        state = AsyncError(error, stack);
      },
    );
    ref.onDispose(() {
      _generation++;
      unawaited(subscription.cancel());
      api.setAccessToken(null);
    });
    final session = client.auth.currentSession;
    if (session == null) return null;
    final profile = await api.loadCustomerProfile(session.accessToken);
    if (!ref.mounted) return null;
    if (current != _generation) return state.value;
    api.setAccessToken(session.accessToken);
    _activeSubject = session.user.id;
    return profile;
  }

  Future<void> _applySession(Session? session) async {
    final current = ++_generation;
    final api = ref.read(apiClientProvider);
    if (session != null && _activeSubject == session.user.id) {
      api.setAccessToken(session.accessToken);
      return;
    }
    _activeSubject = null;
    api.setAccessToken(null);
    state = const AsyncLoading();
    final next = await AsyncValue.guard(() async {
      if (session == null) return null;
      return api.loadCustomerProfile(session.accessToken);
    });
    if (ref.mounted && current == _generation) {
      if (next.hasValue) {
        api.setAccessToken(session?.accessToken);
        _activeSubject = session?.user.id;
      }
      state = next;
    }
  }

  Future<void> sendEmailOtp(String email) async {
    await _client.auth.signInWithOtp(
      email: email.trim(),
      shouldCreateUser: true,
    );
  }

  Future<void> verifyEmailOtp(String email, String token) async {
    await _client.auth.verifyOTP(
      email: email.trim(),
      token: token.trim(),
      type: OtpType.email,
    );
  }

  Future<void> loginWithGoogle() async {
    final launched = await _client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: kIsWeb ? Uri.base.origin : AuthConfig.redirectUrl,
    );
    if (!launched) throw StateError('Tidak dapat membuka login Google.');
  }

  Future<void> logout() async {
    await _client.auth.signOut(scope: SignOutScope.local);
    await ref.read(apiClientProvider).resetGuestSession();
  }
}

final authProvider = AsyncNotifierProvider<AuthNotifier, CustomerProfile?>(
  AuthNotifier.new,
);
