import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:app_links/app_links.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'wishlist_share_links.dart';

abstract class WishlistLinkSource {
  Future<Uri?> initialLink();
  Stream<Uri> get links;
}

class AppWishlistLinkSource implements WishlistLinkSource {
  final AppLinks appLinks;
  AppWishlistLinkSource(this.appLinks);

  @override
  Future<Uri?> initialLink() => appLinks.getInitialLink();

  @override
  Stream<Uri> get links => appLinks.uriLinkStream;
}

final wishlistLinkSourceProvider = Provider<WishlistLinkSource>(
  (ref) => AppWishlistLinkSource(AppLinks()),
);

class WishlistDeepLinks {
  final WishlistShareLinks config;
  final void Function(String token) open;
  StreamSubscription<Uri>? _subscription;
  bool _disposed = false;

  WishlistDeepLinks(this.config, this.open);

  void _accept(Uri? uri) {
    if (_disposed || uri == null) return;
    final token = config.parse(uri);
    if (token != null) open(token);
    // Supabase owns its callback listener. Never forward URLs to auth.
  }

  Future<void> start(WishlistLinkSource source) async {
    _subscription = source.links.listen(
      _accept,
      onError: (Object error, StackTrace stackTrace) {
        debugPrint('Wishlist app-link stream failed: $error\n$stackTrace');
      },
    );
    try {
      _accept(await source.initialLink());
    } catch (error, stackTrace) {
      debugPrint('Unable to read initial wishlist app link: $error\n$stackTrace');
    }
  }

  void dispose() {
    _disposed = true;
    unawaited(_subscription?.cancel());
  }
}
