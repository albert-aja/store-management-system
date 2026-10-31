import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:app_links/app_links.dart';
import 'core/auth_config.dart';
import 'core/app_theme.dart';
import 'core/locale_provider.dart';
import 'screens/main_nav_screen.dart';
import 'core/wishlist_deep_links.dart';
import 'providers/wishlist_share_provider.dart';
import 'screens/shared_wishlist_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppLinks();
  if (AuthConfig.isConfigured) {
    await Supabase.initialize(
      url: AuthConfig.url,
      publishableKey: AuthConfig.publishableKey,
    );
  }
  runApp(const ProviderScope(child: SmsStorefrontApp()));
}

class SmsStorefrontApp extends ConsumerStatefulWidget {
  const SmsStorefrontApp({super.key});

  @override
  ConsumerState<SmsStorefrontApp> createState() => _SmsStorefrontAppState();
}

class _SmsStorefrontAppState extends ConsumerState<SmsStorefrontApp> {
  final _navigatorKey = GlobalKey<NavigatorState>();
  final Set<String> _openTokens = {};
  late final WishlistDeepLinks _deepLinks;

  @override
  void initState() {
    super.initState();
    _deepLinks = WishlistDeepLinks(
      ref.read(wishlistShareLinksProvider),
      _openSharedWishlist,
    );
    _deepLinks.start(ref.read(wishlistLinkSourceProvider));
  }

  void _openSharedWishlist(String token) {
    if (!mounted || !_openTokens.add(token)) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _navigatorKey.currentState
          ?.push(
            MaterialPageRoute<void>(
              settings: RouteSettings(name: '/wishlist/share/$token'),
              builder: (_) => SharedWishlistScreen(token: token),
            ),
          )
          .whenComplete(() => _openTokens.remove(token));
    });
    WidgetsBinding.instance.ensureVisualUpdate();
  }

  @override
  void dispose() {
    _deepLinks.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: _navigatorKey,
      // Plugin owns HTTPS links and Supabase owns its login callback.
      onGenerateInitialRoutes: (_) => [
        MaterialPageRoute<void>(builder: (_) => const MainNavScreen()),
      ],
      title: 'SMS Mart Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      locale: ref.watch(localeProvider),
      supportedLocales: const [Locale('id'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      builder: (context, child) => ColoredBox(
        color: AppTheme.lightBg,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: AppTheme.pageWidth),
            child: child,
          ),
        ),
      ),
      home: const MainNavScreen(),
    );
  }
}
