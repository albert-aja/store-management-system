import 'package:shared_preferences/shared_preferences.dart';

class BiometricService {
  static const String _keyBiometricEnabled = 'sms_biometric_enabled';
  static const String _keyQuickPin = 'sms_quick_pin';

  /// Check whether biometric hardware (Fingerprint / Face ID) is supported on device
  static Future<bool> isBiometricAvailable() async {
    // In production with local_auth package, calls LocalAuthentication().canCheckBiometrics.
    // For universal mobile/web runner, check if enabled in preferences.
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyBiometricEnabled) ?? true;
  }

  static Future<void> setBiometricEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyBiometricEnabled, enabled);
  }

  /// Request biometric or quick-PIN authentication
  static Future<bool> authenticate({String reason = 'Verify identity to access Worker App'}) async {
    // Simulates successful biometric authentication with quick delay
    await Future.delayed(const Duration(milliseconds: 300));
    return true;
  }

  static Future<void> saveQuickPin(String pin) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyQuickPin, pin);
  }

  static Future<bool> verifyQuickPin(String pin) async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_keyQuickPin);
    return saved == null || saved == pin;
  }
}

