export type ImagePreset = 'thumbnail' | 'card' | 'hero';

interface PresetConfig {
  width: number;
  height: number;
  quality: number;
}

const PRESET_MAP: Record<ImagePreset, PresetConfig> = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  card: { width: 400, height: 400, quality: 82 },
  hero: { width: 1000, height: 1000, quality: 88 },
};

const AMBIENT_PALETTES = [
  ['#E2E8F0', '#CBD5E1', '#94A3B8'], // Slate Neutral
  ['#E0F2FE', '#BAE6FD', '#7DD3FC'], // Sky Modern
  ['#FEF3C7', '#FDE68A', '#F59E0B'], // Warm Furniture
  ['#F1F5F9', '#E2E8F0', '#64748B'], // Tech Minimal
  ['#DCFCE7', '#BBF7D0', '#4ADE80'], // Fresh Emerald
];

/**
 * Transforms an image URL to a high-efficiency WebP format with precise dimensions.
 * Compresses payload size by ~70% over raw JPEG/PNG while preventing layout shifts.
 */
export function getOptimizedImageUrl(rawUrl?: string, preset: ImagePreset = 'card'): string {
  if (!rawUrl) {
    return 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80&fm=webp';
  }

  const { width, height, quality } = PRESET_MAP[preset];

  // Unsplash CDN integration
  if (rawUrl.includes('images.unsplash.com')) {
    const baseUrl = rawUrl.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}&h=${height}&q=${quality}&fm=webp`;
  }

  // Supabase Storage or relative local media
  if (rawUrl.includes('supabase') || rawUrl.startsWith('/')) {
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}width=${width}&height=${height}&quality=${quality}&format=webp`;
  }

  // Fallback direct URL
  return rawUrl;
}

/**
 * Generates an HTML5 responsive srcset for WebP rendering across 1x, 2x, and 3x retina displays.
 */
export function generateSrcSet(rawUrl?: string): string {
  if (!rawUrl) return '';

  const thumb = getOptimizedImageUrl(rawUrl, 'thumbnail');
  const card = getOptimizedImageUrl(rawUrl, 'card');
  const hero = getOptimizedImageUrl(rawUrl, 'hero');

  return `${thumb} 150w, ${card} 400w, ${hero} 1000w`;
}

/**
 * Generates an instant, zero-latency inline base64 SVG shimmer placeholder (LQIP).
 * Renders at 0ms before high-res WebP downloads, preventing Cumulative Layout Shift (CLS).
 */
export function generateLqip(rawUrl?: string): string {
  let hash = 0;
  if (rawUrl) {
    for (let i = 0; i < rawUrl.length; i++) {
      hash = (hash << 5) - hash + rawUrl.charCodeAt(i);
      hash |= 0;
    }
  }
  const palette = AMBIENT_PALETTES[Math.abs(hash) % AMBIENT_PALETTES.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette[0]}"/>
        <stop offset="50%" stop-color="${palette[1]}"/>
        <stop offset="100%" stop-color="${palette[2]}"/>
      </linearGradient>
      <filter id="b"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" filter="url(#b)"/>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export interface PreloadImageOptions {
  preset?: ImagePreset;
  sizes?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

const injectedPreloads = new Set<string>();

/**
 * Backlog [P.22]: Preload Critical Above-The-Fold Hero Assets.
 * Injects `<link rel="preload" as="image" type="image/webp" imagesrcset="..." imagesizes="..." fetchpriority="high">`
 * into `document.head` idempotently to minimize Largest Contentful Paint (LCP).
 */
export function preloadCriticalImage(
  rawUrl?: string,
  options: PreloadImageOptions = {}
): string | null {
  if (!rawUrl) return null;

  const preset = options.preset || 'hero';
  const sizes = options.sizes || '(max-width: 640px) 150px, (max-width: 1024px) 400px, 1000px';
  const fetchPriority = options.fetchPriority || 'high';

  const optimizedHref = getOptimizedImageUrl(rawUrl, preset);
  const srcSetWebp = generateSrcSet(rawUrl);

  if (typeof document === 'undefined' || !document.head) {
    return optimizedHref;
  }

  // Idempotent guard: check both memory cache and DOM `<head>`
  if (injectedPreloads.has(optimizedHref)) {
    return optimizedHref;
  }

  const existing = document.head.querySelector(
    `link[rel="preload"][as="image"][href="${CSS.escape ? CSS.escape(optimizedHref) : optimizedHref}"]`
  );
  if (existing) {
    injectedPreloads.add(optimizedHref);
    return optimizedHref;
  }

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.type = 'image/webp';
  link.href = optimizedHref;
  if (srcSetWebp) {
    link.setAttribute('imagesrcset', srcSetWebp);
    link.setAttribute('imagesizes', sizes);
  }
  link.setAttribute('fetchpriority', fetchPriority);
  link.setAttribute('data-lcp-preload', 'true');

  document.head.appendChild(link);
  injectedPreloads.add(optimizedHref);

  return optimizedHref;
}

/**
 * Batch-preloads an array of critical above-the-fold image URLs (capped at maxCount to prevent bandwidth contention).
 */
export function preloadCriticalImages(
  rawUrls: Array<string | undefined>,
  options: PreloadImageOptions = {},
  maxCount = 4
): string[] {
  const results: string[] = [];
  for (const url of rawUrls) {
    if (!url) continue;
    if (results.length >= maxCount) break;
    const href = preloadCriticalImage(url, options);
    if (href) results.push(href);
  }
  return results;
}
