import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/localization/worker_message.dart';
import '../../../l10n/app_localizations.dart';

enum NavigationApp {
  googleMaps('Google Maps'),
  waze('Waze'),
  appleMaps('Apple Maps');

  const NavigationApp(this.label);
  final String label;
}

class NavigationException implements Exception {
  const NavigationException(this.message) : localized = null;
  NavigationException.localized(String Function(AppLocalizations) resolve)
    : message = WorkerMessage(resolve).toString(),
      localized = WorkerMessage(resolve);
  final String message;
  final WorkerMessage? localized;

  @override
  String toString() => message;
}

bool validNavigationDestination(double? latitude, double? longitude) =>
    latitude != null &&
    longitude != null &&
    latitude.isFinite &&
    longitude.isFinite &&
    latitude.abs() <= 90 &&
    longitude.abs() <= 180;

class ExternalNavigationService {
  ExternalNavigationService({
    TargetPlatform? platform,
    bool? isWeb,
    Future<bool> Function(Uri)? canOpen,
    Future<bool> Function(Uri)? open,
  }) : platform = platform ?? defaultTargetPlatform,
       isWeb = isWeb ?? kIsWeb,
       _canOpen = canOpen ?? canLaunchUrl,
       _open =
           open ??
           ((uri) => launchUrl(
             uri,
             mode: uri.scheme == 'https'
                 ? LaunchMode.externalNonBrowserApplication
                 : LaunchMode.externalApplication,
           ));

  static const preferenceKey = 'driver_navigation_app';
  final TargetPlatform platform;
  final bool isWeb;
  final Future<bool> Function(Uri) _canOpen;
  final Future<bool> Function(Uri) _open;

  List<NavigationApp> get supportedApps => isWeb
      ? const []
      : switch (platform) {
          TargetPlatform.iOS => NavigationApp.values,
          TargetPlatform.android => const [
            NavigationApp.googleMaps,
            NavigationApp.waze,
          ],
          _ => const [],
        };

  Future<NavigationApp?> preferredApp() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(preferenceKey);
    if (saved == null) return null;
    final matches = NavigationApp.values.where((app) => app.name == saved);
    if (matches.isEmpty) {
      throw NavigationException.localized(
        (l10n) => l10n.navigationPreferenceInvalid,
      );
    }
    return supportedApps.contains(matches.first) ? matches.first : null;
  }

  Uri destinationUri({
    required NavigationApp app,
    required double latitude,
    required double longitude,
    required String tripId,
    required String stopId,
  }) {
    if (!validNavigationDestination(latitude, longitude)) {
      throw NavigationException.localized((l10n) => l10n.navigationGpsInvalid);
    }
    if (!supportedApps.contains(app)) {
      throw NavigationException.localized(
        (l10n) => l10n.navigationUnsupported(app.label),
      );
    }
    if (tripId.isEmpty || stopId.isEmpty) {
      throw NavigationException.localized(
        (l10n) => l10n.navigationStopRequired,
      );
    }
    final coordinates = '$latitude,$longitude';
    if (app == NavigationApp.waze) {
      return Uri(
        scheme: 'waze',
        host: '',
        queryParameters: {
          'll': coordinates,
          'navigate': 'yes',
          'utm_source': 'sms_worker',
        },
      );
    }
    if (app == NavigationApp.appleMaps) {
      return Uri.https('maps.apple.com', '/', {
        'daddr': coordinates,
        'dirflg': 'd',
      });
    }
    if (platform == TargetPlatform.android) {
      return Uri.parse('google.navigation:q=$coordinates&mode=d');
    }
    final callback = Uri(
      scheme: 'smsworker',
      host: 'navigation',
      pathSegments: ['delivery', tripId],
      queryParameters: {'navigationReturn': 'true', 'stop': stopId},
    );
    return Uri(
      scheme: 'comgooglemaps-x-callback',
      host: '',
      queryParameters: {
        'daddr': coordinates,
        'directionsmode': 'driving',
        'x-source': 'SMS Worker',
        'x-success': callback.toString(),
      },
    );
  }

  Future<void> navigate({
    required NavigationApp app,
    required double latitude,
    required double longitude,
    required String tripId,
    required String stopId,
  }) async {
    final uri = destinationUri(
      app: app,
      latitude: latitude,
      longitude: longitude,
      tripId: tripId,
      stopId: stopId,
    );
    if (!await _canOpen(uri)) {
      throw NavigationException.localized(
        (l10n) => l10n.navigationAppUnavailable(app.label),
      );
    }
    if (!await _open(uri)) {
      throw NavigationException.localized(
        (l10n) => l10n.navigationOpenFailed(app.label),
      );
    }
    final prefs = await SharedPreferences.getInstance();
    if (!await prefs.setString(preferenceKey, app.name)) {
      throw NavigationException.localized(
        (l10n) => l10n.navigationPreferenceSaveFailed,
      );
    }
  }
}

final externalNavigationProvider = Provider<ExternalNavigationService>(
  (ref) => ExternalNavigationService(),
);
