import { BOOKING_SHOWS_CATEGORY } from '../data/booking-constants';

export { BOOKING_SHOWS_CATEGORY };

interface UsherActionLike {
  title: string;
  category: string;
}

const THEATER_SHOW_CATEGORIES = new Set(['Current Productions', 'Coming Soon']);
export const BOOKING_SHOW_TITLES = new Set([
  'Hamilton',
  'The Phantom of the Opera',
  'Wicked',
  'Les Misérables',
  'The Lion King',
]);

const routeByTitle: Record<string, string> = {
  'My Tickets': '/backstage#transactional-ux-data-schemas',
  'Account Settings': '/backstage#global-theming-persistence',
  Preferences: '/backstage#accessibility-motion-control',
  'Venue Information': '/backstage#scalable-venue-logic',
  'Seating Chart': '/#seating-chart',
  'Line Prompter': '/#line-prompter',
};

export const resolveUsherDestination = (action: UsherActionLike): string | undefined => {
  if (THEATER_SHOW_CATEGORIES.has(action.category) || BOOKING_SHOW_TITLES.has(action.title)) {
    return `/?bookingCategory=${encodeURIComponent(BOOKING_SHOWS_CATEGORY)}&bookingShow=${encodeURIComponent(action.title)}#booking-flow`;
  }
  return routeByTitle[action.title];
};
