import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../l10n/app_localizations_en.dart';

/// Deferred rendering keeps errors in their current language after a toggle.
class WorkerMessage implements Exception {
  const WorkerMessage(this.resolve);
  final String Function(AppLocalizations) resolve;
  @override
  String toString() => resolve(AppLocalizationsEn());
}

String localizedError(AppLocalizations l10n, Object? error) =>
    error is WorkerMessage ? error.resolve(l10n) : error?.toString() ?? '';

extension WorkerErrorLocalization on BuildContext {
  String errorText(Object? error) =>
      localizedError(AppLocalizations.of(this), error);
}

class WorkerErrorText extends StatelessWidget {
  const WorkerErrorText(this.error, {super.key});
  final Object? error;
  @override
  Widget build(BuildContext context) => Text(context.errorText(error));
}
