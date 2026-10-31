import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const localePreferenceKey = 'sms_customer_language';
final localePreferencesProvider =
    Provider<Future<SharedPreferences> Function()>(
      (ref) => SharedPreferences.getInstance,
    );

final localeProvider = NotifierProvider<LocaleController, Locale>(
  LocaleController.new,
);
final localeErrorProvider = NotifierProvider<LocaleError, String?>(
  LocaleError.new,
);

class LocaleError extends Notifier<String?> {
  @override
  String? build() => null;
  void update(String? value) => state = value;
}

class LocaleController extends Notifier<Locale> {
  int _revision = 0;
  Future<void> _writes = Future.value();
  late Future<void> _loaded;
  Future<void> get loaded => _loaded;

  @override
  Locale build() {
    final revision = _revision;
    _loaded = Future.microtask(() => _load(revision));
    return const Locale('id');
  }

  Future<void> _load(int revision) async {
    try {
      final preferences = await ref.read(localePreferencesProvider)();
      if (!ref.mounted || revision != _revision) return;
      final language = preferences.getString(localePreferenceKey);
      state = Locale(language == 'en' ? 'en' : 'id');
    } catch (_) {
      if (ref.mounted && revision == _revision) {
        ref.read(localeErrorProvider.notifier).update('load');
      }
    }
  }

  Future<void> select(String language) async {
    if (language != 'id' && language != 'en') return;
    final revision = ++_revision;
    state = Locale(language);
    ref.read(localeErrorProvider.notifier).update(null);
    _writes = _writes.then((_) async {
      try {
        final preferences = await ref.read(localePreferencesProvider)();
        if (!await preferences.setString(localePreferenceKey, language)) {
          throw StateError('Preference write failed');
        }
        if (ref.mounted && revision == _revision) {
          ref.read(localeErrorProvider.notifier).update(null);
        }
      } catch (_) {
        if (ref.mounted && revision == _revision) {
          ref.read(localeErrorProvider.notifier).update('save');
        }
      }
    });
    await _writes;
  }
}
