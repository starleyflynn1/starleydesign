/** Widths used for Now Playing posters (card max ~292px; 680w covers 2× DPR). */
export const POSTER_SRCSET_WIDTHS = [320, 480, 680] as const;

export const POSTER_SIZES = '(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 292px';

export function buildPosterSrcSet(slug: string): string {
  return POSTER_SRCSET_WIDTHS.map((width) => `/images/shows/${slug}-${width}.webp ${width}w`).join(', ');
}

export function posterSrc(slug: string, width: (typeof POSTER_SRCSET_WIDTHS)[number] = 320): string {
  return `/images/shows/${slug}-${width}.webp`;
}

/** First above-the-fold poster — used for HTML preload hints. */
export const LCP_POSTER_SLUG = 'design-system';

export const LCP_POSTER_PRELOAD = {
  href: posterSrc(LCP_POSTER_SLUG, 320),
  imageSrcSet: buildPosterSrcSet(LCP_POSTER_SLUG),
  imageSizes: POSTER_SIZES,
} as const;
