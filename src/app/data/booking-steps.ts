import { BookingStep } from './types';

export const BOOKING_STEPS: BookingStep[] = [
  { number: 1, title: 'Show', description: 'Select production' },
  { number: 2, title: 'Date', description: 'Choose date & time' },
  { number: 3, title: 'Seats', description: 'Choose seats' },
  { number: 4, title: 'Pay', description: 'Mock checkout' },
  { number: 5, title: 'Review', description: 'Review summary' },
];
