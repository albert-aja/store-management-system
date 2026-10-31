import React, { useEffect, useState } from 'react';
import {
  getOptimizedImageUrl,
  generateSrcSet,
  generateLqip,
  preloadCriticalImage,
  ImagePreset,
} from '../utils/imageOptimizer';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  preset?: ImagePreset;
  className?: string;
  sizes?: string;
  /**
   * Backlog [P.22]: Marks above-the-fold hero/LCP assets for immediate `<link rel="preload" as="image">`
   * head injection with `loading="eager"` and `fetchPriority="high"`.
   */
  priority?: boolean;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  preset = 'card',
  className = '',
  sizes = '(max-width: 640px) 150px, (max-width: 1024px) 400px, 1000px',
  priority = false,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fallbackOptimized = getOptimizedImageUrl(src, preset);
  const srcSetWebp = generateSrcSet(src);
  const lqipUri = generateLqip(src);

  useEffect(() => {
    if (priority && src) {
      preloadCriticalImage(src, { preset, sizes, fetchPriority: 'high' });
    }
  }, [priority, src, preset, sizes]);

  if (hasError || !src) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center text-slate-400 ${className}`}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 0ms Instant Inline Base64 SVG LQIP Shimmer */}
      <img
        src={lqipUri}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover filter blur-sm scale-105 transition-opacity duration-300 pointer-events-none ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <picture>
        <source type="image/webp" srcSet={srcSetWebp} sizes={sizes} />
        <img
          src={fallbackOptimized}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...rest}
        />
      </picture>
    </div>
  );
};
