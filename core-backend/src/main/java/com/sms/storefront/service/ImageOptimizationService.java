package com.sms.storefront.service;

import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class ImageOptimizationService {

    public enum ImagePreset {
        THUMBNAIL(150, 150, 80),   // Cart drawer, list previews
        CARD(400, 400, 82),        // Catalog grids, search results
        HERO(1000, 1000, 88);      // Detail pages, zoom galleries

        private final int width;
        private final int height;
        private final int quality;

        ImagePreset(int width, int height, int quality) {
            this.width = width;
            this.height = height;
            this.quality = quality;
        }

        public int getWidth() { return width; }
        public int getHeight() { return height; }
        public int getQuality() { return quality; }
    }

    public record ResponsiveImageSet(
        String originalUrl,
        String thumbnailUrl,
        String cardUrl,
        String heroUrl,
        String srcSetWebp,
        String lqipDataUri,
        String preloadLinkHeader,
        String preloadHtmlTag
    ) {}

    // Ambient color palettes for authentic LQIP shimmers
    private static final String[][] AMBIENT_PALETTES = {
        {"#E2E8F0", "#CBD5E1", "#94A3B8"}, // Slate Neutral
        {"#E0F2FE", "#BAE6FD", "#7DD3FC"}, // Sky Modern
        {"#FEF3C7", "#FDE68A", "#F59E0B"}, // Warm Furniture
        {"#F1F5F9", "#E2E8F0", "#64748B"}, // Tech Minimal
        {"#DCFCE7", "#BBF7D0", "#4ADE80"}  // Fresh Emerald
    };

    /**
     * Resolves an optimized, compressed WebP URL using CDN parameters.
     * Compatible with Cloudflare Images, Imgix, Unsplash, Supabase Storage transforms, or SMS proxy.
     */
    public String getOptimizedUrl(String rawUrl, int width, int height, int quality, String format) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=" + width + "&q=" + quality;
        }

        // If Unsplash URL, append or replace query params directly
        if (rawUrl.contains("images.unsplash.com")) {
            String baseUrl = rawUrl.split("\\?")[0];
            return baseUrl + "?auto=format&fit=crop&w=" + width + "&h=" + height + "&q=" + quality + "&fm=" + format;
        }

        // If Supabase Storage or relative URL, format transform query params
        if (rawUrl.contains("supabase") || rawUrl.startsWith("/")) {
            return rawUrl + (rawUrl.contains("?") ? "&" : "?") + "width=" + width + "&height=" + height + "&quality=" + quality + "&format=" + format;
        }

        // Default: generate standard Cloudflare / CDN style transformation URL
        return "/api/v1/storefront/images/transform?url=" + URLEncoder.encode(rawUrl, StandardCharsets.UTF_8)
                + "&w=" + width + "&h=" + height + "&q=" + quality + "&fmt=" + format;
    }

    public String getPresetUrl(String rawUrl, ImagePreset preset) {
        return getOptimizedUrl(rawUrl, preset.getWidth(), preset.getHeight(), preset.getQuality(), "webp");
    }

    /**
     * Generates a compact base64 SVG Low-Quality Image Placeholder (LQIP).
     * Renders instantly (0ms) to eliminate Cumulative Layout Shift (CLS) before WebP loads.
     */
    public String generateLqip(String rawUrl) {
        int hash = rawUrl != null ? Math.abs(rawUrl.hashCode()) : 0;
        String[] palette = AMBIENT_PALETTES[hash % AMBIENT_PALETTES.length];

        String svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>"
                + "<defs>"
                + "<linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>"
                + "<stop offset='0%' stop-color='" + palette[0] + "'/>"
                + "<stop offset='50%' stop-color='" + palette[1] + "'/>"
                + "<stop offset='100%' stop-color='" + palette[2] + "'/>"
                + "</linearGradient>"
                + "<filter id='b'><feGaussianBlur stdDeviation='5'/></filter>"
                + "</defs>"
                + "<rect width='100%' height='100%' fill='url(#g)' filter='url(#b)'/>"
                + "</svg>";

        String base64Svg = Base64.getEncoder().encodeToString(svg.getBytes(StandardCharsets.UTF_8));
        return "data:image/svg+xml;base64," + base64Svg;
    }

    public ResponsiveImageSet generateResponsiveSet(String rawUrl) {
        String thumbnail = getPresetUrl(rawUrl, ImagePreset.THUMBNAIL);
        String card = getPresetUrl(rawUrl, ImagePreset.CARD);
        String hero = getPresetUrl(rawUrl, ImagePreset.HERO);
        String lqip = generateLqip(rawUrl);

        // Standard HTML5 responsive srcSet for 1x, 2x, 3x pixel densities
        String srcSet = thumbnail + " 150w, " + card + " 400w, " + hero + " 1000w";
        String defaultSizes = "(max-width: 640px) 150px, (max-width: 1024px) 400px, 1000px";

        String preloadHeader = generatePreloadLinkHeader(hero, srcSet, defaultSizes);
        String preloadTag = generatePreloadHtmlTag(hero, srcSet, defaultSizes);

        return new ResponsiveImageSet(rawUrl, thumbnail, card, hero, srcSet, lqip, preloadHeader, preloadTag);
    }

    /**
     * Generates a W3C HTTP {@code Link: <url>; rel=preload; as=image} header value
     * to trigger early browser resource fetching and minimize Largest Contentful Paint (LCP).
     */
    public String generatePreloadLinkHeader(String heroUrl, String srcSetWebp, String sizes) {
        String effectiveSizes = (sizes != null && !sizes.isBlank())
                ? sizes
                : "(max-width: 640px) 150px, (max-width: 1024px) 400px, 1000px";
        return String.format(
                "<%s>; rel=preload; as=image; type=\"image/webp\"; imagesrcset=\"%s\"; imagesizes=\"%s\"; fetchpriority=\"high\"",
                heroUrl, srcSetWebp, effectiveSizes);
    }

    /**
     * Generates an HTML5 {@code <link rel="preload" as="image" ...>} tag string for above-the-fold SSR/CSR head injection.
     */
    public String generatePreloadHtmlTag(String heroUrl, String srcSetWebp, String sizes) {
        String effectiveSizes = (sizes != null && !sizes.isBlank())
                ? sizes
                : "(max-width: 640px) 150px, (max-width: 1024px) 400px, 1000px";
        return String.format(
                "<link rel=\"preload\" as=\"image\" href=\"%s\" type=\"image/webp\" imagesrcset=\"%s\" imagesizes=\"%s\" fetchpriority=\"high\" />",
                heroUrl, srcSetWebp, effectiveSizes);
    }
}
