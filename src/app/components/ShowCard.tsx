import React from 'react';
import { Calendar, Star } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ShowCardProps {
  title: string;
  image: string;
  date: string;
  scope: string;
  stack: string;
  impact: string;
  role: string;
  badge?: 'Selling Fast' | 'Last Seats' | 'New' | 'Starting Soon';
  rating?: number;
  onClick?: () => void;
}

const badgeStyles = {
  'Selling Fast': 'show-badge-selling-fast',
  'Last Seats': 'show-badge-last-seats',
  'New': 'show-badge-new',
  'Starting Soon': 'show-badge-starting-soon',
};

export function ShowCard({
  title,
  image,
  date,
  scope,
  stack,
  impact,
  role,
  badge,
  rating,
  onClick,
}: ShowCardProps) {
  return (
    <div
      onClick={onClick}
      className="show-card group"
    >
      <div className="show-card-media">
        <ImageWithFallback
          src={image}
          alt={title}
          className="show-card-image"
        />
        <div className="show-card-media-tint"></div>

        {badge && (
          <div className="show-card-badge-wrap">
            <span className={`show-card-badge ${badgeStyles[badge]}`}>
              {badge}
            </span>
          </div>
        )}

        {rating && (
          <div className="show-card-rating">
            <Star className="show-card-rating-icon" />
            <span className="show-card-rating-text">{rating.toFixed(1)}</span>
          </div>
        )}

        <div className="show-card-media-gradient"></div>
      </div>

      <div className="show-card-body">
        <h3 className="show-card-title">
          {title}
        </h3>

        <div className="show-card-meta">
          <div className="show-card-meta-row show-card-meta-primary">
            <Calendar className="show-card-icon-sm" />
            <span className="show-card-meta-value">{date}</span>
            <span className="show-card-meta-divider" aria-hidden="true"></span>
            <span className="show-card-meta-value">{scope}</span>
          </div>
          <div className="show-card-meta-row">
            <span className="show-card-stack">{stack}</span>
          </div>
        </div>

        <div className="show-card-footer">
          <div className="show-card-impact">
            <div className="show-card-price-label">{role}</div>
            <div className="show-card-price">{impact}</div>
          </div>

          <div className="show-card-action-row">
            <button className="show-card-btn">
              View Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
