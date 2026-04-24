import { Calendar, Clock, MapPin, Star } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ShowCardProps {
  title: string;
  image: string;
  date: string;
  time: string;
  venue: string;
  price: string;
  badge?: 'Selling Fast' | 'Last Seats' | 'New' | 'Starting Soon';
  rating?: number;
  onClick?: () => void;
}

const badgeStyles = {
  'Selling Fast': 'bg-accent-primary/20 text-accent-primary border-accent-primary/30',
  'Last Seats': 'bg-accent-primary/30 text-accent-primary border-accent-primary/50',
  'New': 'bg-spotlight/20 text-spotlight border-spotlight/30',
  'Starting Soon': 'bg-seat-available/20 text-seat-available border-seat-available/30',
};

export function ShowCard({
  title,
  image,
  date,
  time,
  venue,
  price,
  badge,
  rating,
  onClick,
}: ShowCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-card hover:bg-card/80 border border-border transition-all cursor-pointer hover:shadow-xl hover:shadow-spotlight/10 hover:-translate-y-1"
    >
      <div className="aspect-[2/3] overflow-hidden relative">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />

        {badge && (
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 text-xs rounded-full border backdrop-blur-md ${badgeStyles[badge]}`}>
              {badge}
            </span>
          </div>
        )}

        {rating && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-stage-base/80 backdrop-blur-md rounded-full">
            <Star className="w-3 h-3 fill-spotlight text-spotlight" />
            <span className="text-xs text-marquee-surface">{rating.toFixed(1)}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stage-base/90 to-transparent"></div>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-lg line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h3>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-spotlight" />
            <span>{date}</span>
          </div>


          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-spotlight" />
            <span>{venue}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">Starting from</div>
            <div className="text-xl text-spotlight">{price}</div>
          </div>

          <button className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/80 text-white rounded-lg transition-colors">
            View Script
          </button>
        </div>
      </div>
    </div>
  );
}
