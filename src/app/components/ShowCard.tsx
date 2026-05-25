import React from 'react';
import { CalendarIcon, StarIcon } from './AppIcons';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ShowCardProps {
  title: string;
  image: string;
  imageSrcSet?: string;
  imageSizes?: string;
  date: string;
  scope: string;
  stack: string;
  impact: string;
  role: string;
  badge?: 'Selling Fast' | 'Last Seats' | 'New' | 'Starting Soon';
  rating?: number;
  onClick?: () => void;
  scriptHref?: string;
  /** When true, poster loads eagerly with high fetch priority (above-the-fold / LCP candidates). */
  priority?: boolean;
}

const badgeStyles = {
  'Selling Fast': 'show-badge-selling-fast',
  'Last Seats': 'show-badge-last-seats',
  'New': 'show-badge-new',
  'Starting Soon': 'show-badge-starting-soon',
};

function toWebpSrcSet(srcSet?: string) {
  if (!srcSet) return undefined;
  return srcSet.replace(/\.jpe?g(\s+\d+w)/gi, '.webp$1');
}

export function ShowCard({
  title,
  image,
  imageSrcSet,
  imageSizes,
  date,
  scope,
  stack,
  impact,
  role,
  badge,
  rating,
  onClick,
  scriptHref,
  priority = false,
}: ShowCardProps) {
  const webpSrcSet = toWebpSrcSet(imageSrcSet);

  return (
    <div
      onClick={onClick}
      className="show-card group"
    >
      <div className="show-card-media">
        <picture className="show-card-picture">
          {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={imageSizes} />}
          <ImageWithFallback
            src={image}
            srcSet={imageSrcSet}
            sizes={imageSizes}
            alt={title}
            className="show-card-image"
            width={320}
            height={480}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
          />
        </picture>

        {badge && (
          <div className="show-card-badge-wrap">
            <span className={`show-card-badge ${badgeStyles[badge]}`}>
              {badge}
            </span>
          </div>
        )}

        {rating && (
          <div className="show-card-rating">
            <StarIcon className="show-card-rating-icon" />
            <span className="show-card-rating-text">{rating.toFixed(1)}</span>
          </div>
        )}

      </div>

      <div className="show-card-body">
        <h3 className="show-card-title">
          {title}
        </h3>

        <div className="show-card-meta">
          <div className="show-card-meta-row show-card-meta-primary">
            <CalendarIcon className="show-card-icon-sm" />
            <span className="show-card-meta-value">{date}</span>
          </div>
          <div className="show-card-meta-row">
            <span className="show-card-meta-value">{scope}</span>
          </div>
          <div className="show-card-meta-row">
            <span className="show-card-stack">{stack}</span>
          </div>
        </div>

        <div className="show-card-footer">
          <div className="show-card-price-label">{role}</div>
          <div className="show-card-price">{impact}</div>
          <button
            type="button"
            className="show-card-btn"
            onClick={(event) => {
              event.stopPropagation();
              if (typeof window !== 'undefined') {
                window.location.assign(scriptHref || '/script');
                return;
              }
              onClick?.();
            }}
          >
            View Script
          </button>
        </div>
      </div>
    </div>
  );
}
