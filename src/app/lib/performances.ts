import { Performance } from '../data/types';

const hashSeed = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const seededRange = (seed: number, min: number, max: number) => {
  const value = (seed % (max - min + 1)) + min;
  return value;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const nextWeekdayDate = (fromDate: Date, targetDay: number) => {
  const date = new Date(fromDate);
  const delta = (targetDay - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + delta);
  return date;
};

export const buildUpcomingPerformances = (): Performance[] => {
  const today = startOfDay(new Date());
  const weekdays = [5, 6, 0]; // Friday, Saturday, Sunday
  const slots: { date: Date; type: 'matinee' | 'evening'; time: string }[] = [];

  for (let week = 0; week < 6; week += 1) {
    weekdays.forEach((weekday) => {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + week * 7);
      const date = nextWeekdayDate(weekStart, weekday);
      slots.push({ date, type: 'matinee', time: '2:00 PM' });
      slots.push({ date, type: 'evening', time: '7:30 PM' });
    });
  }

  const slotAvailabilities = slots.map((slot) => {
    const seed = hashSeed(`${slot.date.toISOString()}-${slot.type}`);
    return seededRange(seed, 6, 92);
  });

  // Guarantee at least one sold-out and one nearly sold-out slot.
  if (slotAvailabilities.length > 0) slotAvailabilities[0] = 0;
  if (slotAvailabilities.length > 1) slotAvailabilities[1] = 4;

  const byDate = new Map<string, Performance>();
  slots.forEach((slot, index) => {
    const key = slot.date.toDateString();
    const existing = byDate.get(key);
    const timeEntry = {
      time: slot.time,
      type: slot.type,
      available: slotAvailabilities[index],
    };
    if (existing) {
      existing.times.push(timeEntry);
      return;
    }
    byDate.set(key, { date: slot.date, times: [timeEntry] });
  });

  return Array.from(byDate.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
};
