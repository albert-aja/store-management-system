import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/app_text.dart';
import '../core/locale_provider.dart';

class LanguageSwitcher extends ConsumerWidget {
  const LanguageSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final error = ref.watch(localeErrorProvider);
    final english = isEnglish(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (error != null)
          IconButton(
            tooltip: error == 'load'
                ? (english
                      ? 'Language preference could not be loaded. Select a language to retry.'
                      : 'Pilihan bahasa tidak dapat dimuat. Pilih bahasa untuk mencoba lagi.')
                : (english
                      ? 'Language preference could not be saved. Tap to retry.'
                      : 'Pilihan bahasa tidak dapat disimpan. Ketuk untuk mencoba lagi.'),
            onPressed: () =>
                ref.read(localeProvider.notifier).select(locale.languageCode),
            icon: Icon(
              Icons.warning_amber_rounded,
              color: Theme.of(context).colorScheme.error,
            ),
          ),
        PopupMenuButton<String>(
          key: const Key('language-switcher'),
          tooltip: english ? 'Language' : 'Bahasa',
          initialValue: locale.languageCode,
          onSelected: (value) =>
              ref.read(localeProvider.notifier).select(value),
          itemBuilder: (_) => const [
            PopupMenuItem(value: 'id', child: Text('Bahasa Indonesia')),
            PopupMenuItem(value: 'en', child: Text('English')),
          ],
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.language, size: 20),
                const SizedBox(width: 4),
                Text(locale.languageCode.toUpperCase()),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
