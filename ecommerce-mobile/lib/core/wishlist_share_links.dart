class MissingStorefrontUrl implements Exception {
  const MissingStorefrontUrl();
}

class WishlistShareLinks {
  final String publicUrl;
  const WishlistShareLinks([
    this.publicUrl = const String.fromEnvironment('PUBLIC_STOREFRONT_URL'),
  ]);

  static bool safeToken(String token) =>
      RegExp(r'^[A-Za-z0-9_-]{1,256}$').hasMatch(token);

  Uri get origin {
    final uri = Uri.tryParse(publicUrl);
    if (uri == null ||
        uri.scheme != 'https' ||
        uri.host.isEmpty ||
        uri.userInfo.isNotEmpty ||
        uri.hasQuery ||
        uri.hasFragment ||
        (uri.path.isNotEmpty && uri.path != '/')) {
      throw const MissingStorefrontUrl();
    }
    return uri.replace(path: '');
  }

  Uri create(String token) {
    if (!safeToken(token)) throw const FormatException('Invalid share token');
    return origin.replace(path: '/wishlist/share/$token');
  }

  String? parse(Uri uri) {
    Uri configured;
    try {
      configured = origin;
    } on MissingStorefrontUrl {
      return null;
    }
    if (uri.scheme != 'https' ||
        uri.host != configured.host ||
        uri.port != configured.port ||
        uri.userInfo.isNotEmpty ||
        uri.hasQuery ||
        uri.hasFragment) {
      return null;
    }
    // Check the raw path too: encoded separators/tokens are not accepted.
    final match = RegExp(
      r'^/wishlist/share/([A-Za-z0-9_-]{1,256})$',
    ).firstMatch(uri.path);
    return match?.group(1);
  }
}
