import { BOOKING_SHOWS, BOOKING_SHOWS_CATEGORY } from '../data/booking-shows';

interface UsherActionLike {
  title: string;
  category: string;
}

const THEATER_SHOW_CATEGORIES = new Set(['Current Productions', 'Coming Soon']);
const THEATER_SHOW_TITLES = new Set(BOOKING_SHOWS.map((show) => show.title));

const routeByTitle: Record<string, string> = {
  'My Tickets': '/backstage#transactional-ux-data-schemas',
  'Account Settings': '/backstage#global-theming-persistence',
  Preferences: '/backstage#accessibility-motion-control',
  'Venue Information': '/backstage#scalable-venue-logic',
  'Seating Chart': '/#seating-chart',
};

export const resolveUsherDestination = (action: UsherActionLike): string | undefined => {
  if (THEATER_SHOW_CATEGORIES.has(action.category) || THEATER_SHOW_TITLES.has(action.title)) {
    return `/?bookingCategory=${encodeURIComponent(BOOKING_SHOWS_CATEGORY)}&bookingShow=${encodeURIComponent(action.title)}#booking-flow`;
  }
  return routeByTitle[action.title];
};
