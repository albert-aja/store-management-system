class AuthConfig {
  static const url = String.fromEnvironment('SUPABASE_URL');
  static const publishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
  );
  static const redirectUrl = 'com.sms.mart://login-callback/';
  static bool get isConfigured => url.isNotEmpty && publishableKey.isNotEmpty;
}
