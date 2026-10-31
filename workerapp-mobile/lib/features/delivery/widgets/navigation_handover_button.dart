import 'package:sms_mobile/core/localization/worker_locale.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/delivery_model.dart';
import '../services/external_navigation_service.dart';
import '../../../core/localization/worker_message.dart';

class NavigationHandoverButton extends ConsumerStatefulWidget {
  const NavigationHandoverButton({
    super.key,
    required this.tripId,
    required this.order,
    required this.onReturned,
  });

  final String tripId;
  final DeliveryOrderModel order;
  final VoidCallback onReturned;

  @override
  ConsumerState<NavigationHandoverButton> createState() =>
      _NavigationHandoverButtonState();
}

class _NavigationHandoverButtonState
    extends ConsumerState<NavigationHandoverButton>
    with WidgetsBindingObserver {
  NavigationApp? _preferred;
  bool _busy = false;
  bool _pendingReturn = false;
  bool _leftApp = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadPreference();
  }

  Future<void> _loadPreference() async {
    try {
      final preferred = await ref
          .read(externalNavigationProvider)
          .preferredApp();
      if (mounted) setState(() => _preferred = preferred);
    } on NavigationException catch (error) {
      _showError(error.localized ?? error.message);
    } on PlatformException catch (error) {
      _showError(WorkerMessage((l10n) => l10n.message220(error.message ?? '')));
    } on MissingPluginException {
      _showError(WorkerMessage((l10n) => l10n.message221));
    }
  }

  void _showError(Object message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: WorkerErrorText(message)));
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_pendingReturn) return;
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.hidden) {
      _leftApp = true;
    } else if (state == AppLifecycleState.resumed && _leftApp) {
      _pendingReturn = false;
      _leftApp = false;
      widget.onReturned();
    }
  }

  Future<NavigationApp?> _chooseApp() => showModalBottomSheet<NavigationApp>(
    context: context,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Text(context.l10n.message222),
          ),
          for (final app in ref.read(externalNavigationProvider).supportedApps)
            ListTile(
              leading: const Icon(Icons.navigation_outlined),
              title: Text(app.label),
              onTap: () => Navigator.pop(context, app),
            ),
        ],
      ),
    ),
  );

  Future<void> _navigate({bool choose = false}) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final preferred = choose
          ? null
          : await ref.read(externalNavigationProvider).preferredApp();
      if (!mounted) return;
      final app = preferred ?? await _chooseApp();
      if (app == null || !mounted) return;
      _pendingReturn = true;
      _leftApp = false;
      await ref
          .read(externalNavigationProvider)
          .navigate(
            app: app,
            latitude: widget.order.destinationLatitude!,
            longitude: widget.order.destinationLongitude!,
            tripId: widget.tripId,
            stopId: widget.order.id,
          );
      if (mounted) setState(() => _preferred = app);
    } on NavigationException catch (error) {
      _pendingReturn = false;
      _showError(error.localized ?? error.message);
    } on PlatformException catch (error) {
      _pendingReturn = false;
      _showError(WorkerMessage((l10n) => l10n.message223(error.message ?? '')));
    } on MissingPluginException {
      _pendingReturn = false;
      _showError(WorkerMessage((l10n) => l10n.message221));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!validNavigationDestination(
      widget.order.destinationLatitude,
      widget.order.destinationLongitude,
    )) {
      return Text(context.l10n.message224);
    }
    if (ref.watch(externalNavigationProvider).supportedApps.isEmpty) {
      return Text(context.l10n.message225);
    }
    return Row(
      children: [
        Expanded(
          child: FilledButton.icon(
            onPressed: _busy ? null : () => _navigate(),
            icon: const Icon(Icons.navigation_outlined),
            label: Text(
              _busy
                  ? context.l10n.message226
                  : _preferred == null
                  ? context.l10n.navigate
                  : context.l10n.navigateWithApp(_preferred!.label),
            ),
          ),
        ),
        IconButton(
          tooltip: context.l10n.message227,
          onPressed: _busy ? null : () => _navigate(choose: true),
          icon: const Icon(Icons.more_horiz),
        ),
      ],
    );
  }
}
