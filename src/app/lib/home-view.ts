import { stripAppBasePath } from './app-base';

export type HomeView = 'home' | 'booking' | 'seating' | 'calendar' | 'prompter';

/** Read home segment from the current URL hash (sync on first paint to avoid footer/view flash). */
export function readHomeViewFromLocation(): HomeView {
  if (typeof window === 'undefined') return 'seating';

  const path = stripAppBasePath(window.location.pathname);
  if (path !== '/') return 'seating';

  const hash = window.location.hash;
  if (hash === '#stage') return 'home';
  if (hash === '#seating-chart' || hash === '#seating') return 'seating';
  if (hash === '#booking-flow' || hash === '#booking') return 'booking';
  if (hash === '#calendar') return 'calendar';
  if (hash === '#line-prompter' || hash === '#prompter') return 'prompter';
  return 'seating';
}
