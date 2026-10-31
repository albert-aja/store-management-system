import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../l10n/app_localizations.dart';

extension WorkerLocalization on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
  String get languageTag => l10n.localeName;
}

abstract class LocaleStore {
  Future<String?> load();
  Future<void> save(String language);
}

class PreferencesLocaleStore implements LocaleStore {
  static const key = 'worker_ui_language';
  @override
  Future<String?> load() async =>
      (await SharedPreferences.getInstance()).getString(key);
  @override
  Future<void> save(String language) async {
    if (!await (await SharedPreferences.getInstance()).setString(
      key,
      language,
    )) {
      throw StateError('locale-write');
    }
  }
}

final localeStoreProvider = Provider<LocaleStore>(
  (ref) => PreferencesLocaleStore(),
);

class WorkerLocaleState {
  const WorkerLocaleState({
    this.locale = const Locale('id'),
    this.failure = false,
    this.saving = false,
  });
  final Locale locale;
  final bool failure;
  final bool saving;
}

class WorkerLocaleNotifier extends Notifier<WorkerLocaleState> {
  int _revision = 0;
  @override
  WorkerLocaleState build() {
    Future.microtask(_restore);
    return const WorkerLocaleState();
  }

  Future<void> _restore() async {
    final revision = _revision;
    try {
      final language = await ref.read(localeStoreProvider).load();
      if (!ref.mounted || revision != _revision) return;
      if (language != null && language != 'id' && language != 'en') {
        state = const WorkerLocaleState(failure: true);
      } else {
        state = WorkerLocaleState(locale: Locale(language ?? 'id'));
      }
    } catch (_) {
      if (ref.mounted && revision == _revision) {
        state = WorkerLocaleState(locale: state.locale, failure: true);
      }
    }
  }

  Future<void> select(String language) async {
    if (state.saving || (language != 'id' && language != 'en')) return;
    _revision++;
    state = WorkerLocaleState(locale: Locale(language), saving: true);
    try {
      await ref.read(localeStoreProvider).save(language);
      if (ref.mounted) {
        state = WorkerLocaleState(locale: Locale(language));
      }
    } catch (_) {
      if (ref.mounted) {
        state = WorkerLocaleState(locale: Locale(language), failure: true);
      }
    }
  }
}

final workerLocaleProvider =
    NotifierProvider<WorkerLocaleNotifier, WorkerLocaleState>(
      WorkerLocaleNotifier.new,
    );

class WorkerLanguageSwitcher extends ConsumerWidget {
  const WorkerLanguageSwitcher({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(workerLocaleProvider);
    return PopupMenuButton<String>(
      tooltip: context.l10n.language,
      initialValue: state.locale.languageCode,
      enabled: !state.saving,
      onSelected: (language) =>
          ref.read(workerLocaleProvider.notifier).select(language),
      itemBuilder: (_) => const [
        PopupMenuItem(value: 'id', child: Text('ID — Bahasa Indonesia')),
        PopupMenuItem(value: 'en', child: Text('EN — English')),
      ],
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text(
          state.locale.languageCode.toUpperCase(),
          semanticsLabel: context.l10n.language,
        ),
      ),
    );
  }
}
