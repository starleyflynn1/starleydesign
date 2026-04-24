import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';

interface Performance {
  date: Date;
  times: { time: string; type: 'matinee' | 'evening'; available: number }[];
}

interface PerformanceCalendarProps {
  performances: Performance[];
  onSelectPerformance?: (date: Date, time: string, type: 'matinee' | 'evening') => void;
}

export function PerformanceCalendar({ performances, onSelectPerformance }: PerformanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const hasPerformance = (day: number) => {
    return performances.some(
      (p) =>
        p.date.getDate() === day &&
        p.date.getMonth() === currentMonth.getMonth() &&
        p.date.getFullYear() === currentMonth.getFullYear()
    );
  };

  const getPerformancesForDate = (date: Date) => {
    return performances.find(
      (p) =>
        p.date.getDate() === date.getDate() &&
        p.date.getMonth() === date.getMonth() &&
        p.date.getFullYear() === date.getFullYear()
    );
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isToday =
      date.getDate() === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear();
    const isPast = date < new Date() && !isToday;
    const hasShow = hasPerformance(day);
    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth();

    days.push(
      <button
        key={day}
        onClick={() => hasShow && !isPast && setSelectedDate(date)}
        disabled={isPast || !hasShow}
        className={`aspect-square rounded-lg flex items-center justify-center relative transition-all ${
          isPast
            ? 'text-muted-foreground/30 cursor-not-allowed'
            : isSelected
            ? 'bg-spotlight text-stage-base ring-2 ring-spotlight'
            : hasShow
            ? 'hover:bg-spotlight/20 border border-spotlight/30'
            : 'text-muted-foreground cursor-not-allowed'
        } ${isToday && !isSelected ? 'ring-1 ring-accent-primary' : ''}`}
      >
        <span className="text-sm">{day}</span>
        {hasShow && !isPast && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-primary"></div>
        )}
      </button>
    );
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const selectedPerformance = selectedDate ? getPerformancesForDate(selectedDate) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-spotlight/10 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-spotlight/10 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm text-muted-foreground py-2">
            {day}
          </div>
        ))}
        {days}
      </div>

      {selectedPerformance && (
        <div className="p-6 bg-card rounded-lg border border-spotlight/30">
          <div className="text-sm text-muted-foreground mb-4">
            {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>

          <div className="space-y-3">
            {selectedPerformance.times.map((performance) => (
              <button
                key={performance.time}
                onClick={() =>
                  onSelectPerformance?.(selectedDate!, performance.time, performance.type)
                }
                disabled={performance.available === 0}
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  performance.available === 0
                    ? 'border-border bg-card/50 cursor-not-allowed opacity-50'
                    : 'border-spotlight/30 hover:bg-spotlight/10 hover:border-spotlight'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {performance.type === 'matinee' ? (
                      <Sun className="w-5 h-5 text-spotlight" />
                    ) : (
                      <Moon className="w-5 h-5 text-spotlight" />
                    )}
                    <div>
                      <div className="text-sm capitalize">{performance.type}</div>
                      <div className="text-lg">{performance.time}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    {performance.available > 0 ? (
                      <>
                        <div className="text-sm text-muted-foreground">{performance.available} seats</div>
                        <div className="text-xs text-seat-available">Available</div>
                      </>
                    ) : (
                      <div className="text-xs text-accent-primary">Sold Out</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
