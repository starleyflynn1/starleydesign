import { Show } from './types';
import { buildPosterSrcSet, posterSrc, POSTER_SIZES } from '../lib/show-posters';

function showPoster(slug: string): Pick<Show, 'image' | 'imageSrcSet' | 'imageSizes'> {
  return {
    image: posterSrc(slug, 320),
    imageSrcSet: buildPosterSrcSet(slug),
    imageSizes: POSTER_SIZES,
  };
}

export const SHOWS: Show[] = [
  {
    title: 'The Design System',
    ...showPoster('design-system'),
    date: '2026',
    scope: 'User Experience Architecture',
    stack: 'React · TypeScript · Figma',
    impact: 'Current Run',
    role: 'Interaction Designer',
  },
  {
    title: 'Salesforce',
    ...showPoster('salesforce'),
    date: '2022 — 2026',
    scope: 'Digital Campus at Scale',
    stack: 'Javascript · GraphQL · Java',
    impact: 'Architectual Design',
    role: 'Senior Member of Technical Staff',
  },
  {
    title: 'Google',
    ...showPoster('google'),
    date: '2021 — 2022',
    scope: 'Lead Management Engine',
    stack: 'Javascript · LWC · Java',
    impact: 'High Performance Delivery',
    role: 'Application Engineer',
  },
  {
    title: 'BFA Theater',
    ...showPoster('bfa-theater'),
    date: '2003 — 2007',
    scope: 'Collaborative Production',
    stack: 'Narrative & User Psychology',
    impact: 'Foundational Empathy',
    role: 'The Origin Story',
  },
];
