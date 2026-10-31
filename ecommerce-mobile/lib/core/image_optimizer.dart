import 'package:flutter/material.dart';

enum ImagePreset {
  thumbnail(150, 150, 80),
  card(400, 400, 82),
  hero(1000, 1000, 88);

  final int width;
  final int height;
  final int quality;

  const ImagePreset(this.width, this.height, this.quality);
}

class ImageOptimizer {
  static const List<List<Color>> ambientPalettes = [
    [Color(0xFFE2E8F0), Color(0xFFCBD5E1), Color(0xFF94A3B8)], // Slate Neutral
    [Color(0xFFE0F2FE), Color(0xFFBAE6FD), Color(0xFF7DD3FC)], // Sky Modern
    [Color(0xFFFEF3C7), Color(0xFFFDE68A), Color(0xFFF59E0B)], // Warm Furniture
    [Color(0xFFF1F5F9), Color(0xFFE2E8F0), Color(0xFF64748B)], // Tech Minimal
    [Color(0xFFDCFCE7), Color(0xFFBBF7D0), Color(0xFF4ADE80)], // Fresh Emerald
  ];

  static String getOptimizedUrl(
    String? rawUrl, {
    ImagePreset preset = ImagePreset.card,
  }) {
    if (rawUrl == null || rawUrl.isEmpty) {
      return 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=${preset.width}&q=${preset.quality}&fm=webp';
    }

    if (rawUrl.contains('images.unsplash.com')) {
      final baseUrl = rawUrl.split('?').first;
      return '$baseUrl?auto=format&fit=crop&w=${preset.width}&h=${preset.height}&q=${preset.quality}&fm=webp';
    }

    if (rawUrl.contains('supabase') || rawUrl.startsWith('/')) {
      final separator = rawUrl.contains('?') ? '&' : '?';
      return '$rawUrl${separator}width=${preset.width}&height=${preset.height}&quality=${preset.quality}&format=webp';
    }

    return rawUrl;
  }

  /// Generates a deterministically tinted LQIP gradient based on URL hash.
  /// Eliminates visual flash/CLS while high-res WebP loads on mobile network.
  static LinearGradient getLqipGradient(String? rawUrl) {
    int hash = 0;
    if (rawUrl != null && rawUrl.isNotEmpty) {
      for (int i = 0; i < rawUrl.length; i++) {
        hash = (hash << 5) - hash + rawUrl.codeUnitAt(i);
        hash = hash & 0xFFFFFFFF;
      }
    }
    final colors = ambientPalettes[hash.abs() % ambientPalettes.length];
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: colors,
    );
  }

  /// Builds a low-overhead shimmer placeholder for Image.network loadingBuilder.
  static Widget buildLqipPlaceholder(
    BuildContext context,
    String? rawUrl, {
    double? width,
    double? height,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(gradient: getLqipGradient(rawUrl)),
      child: const Center(
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.black12),
          ),
        ),
      ),
    );
  }

  /// Backlog [P.22]: Preloads critical above-the-fold hero and card images into Flutter's ImageCache
  /// to eliminate first-frame decode latency and minimize mobile Largest Contentful Paint (LCP).
  static final Set<String> _preloadedUrls = <String>{};

  static bool isPreloaded(
    String? rawUrl, {
    ImagePreset preset = ImagePreset.hero,
  }) {
    if (rawUrl == null || rawUrl.isEmpty) return false;
    return _preloadedUrls.contains(getOptimizedUrl(rawUrl, preset: preset));
  }

  static void registerPreloadedUrl(
    String? rawUrl, {
    ImagePreset preset = ImagePreset.hero,
  }) {
    if (rawUrl == null || rawUrl.isEmpty) return;
    _preloadedUrls.add(getOptimizedUrl(rawUrl, preset: preset));
  }

  static Future<void> preloadCriticalAsset(
    BuildContext context,
    String? rawUrl, {
    ImagePreset preset = ImagePreset.hero,
  }) async {
    if (rawUrl == null || rawUrl.isEmpty) return;
    final optimizedUrl = getOptimizedUrl(rawUrl, preset: preset);
    if (_preloadedUrls.contains(optimizedUrl)) return;
    _preloadedUrls.add(optimizedUrl);
    try {
      await precacheImage(NetworkImage(optimizedUrl), context);
    } catch (_) {
      // Ignore network errors in offline/test environments
    }
  }
}
