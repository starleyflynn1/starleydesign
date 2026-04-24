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
    days.push(<div key={`empty-${i}`} className="calendar-empty-day"></div>);
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
        className={`calendar-day-btn ${
          isPast
            ? 'calendar-day-past'
            : isSelected
            ? 'calendar-day-selected'
            : hasShow
            ? 'calendar-day-available'
            : 'calendar-day-unavailable'
        } ${isToday && !isSelected ? 'calendar-day-today' : ''}`}
      >
        <span className="calendar-day-number">{day}</span>
        {hasShow && !isPast && (
          <div className="calendar-dot"></div>
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
    <div className="calendar-root">
      <div className="calendar-head">
        <h3 className="calendar-title">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="calendar-nav">
          <button
            onClick={previousMonth}
            className="calendar-nav-btn"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="calendar-nav-btn"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="calendar-week-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {days}
      </div>

      {selectedPerformance && (
        <div className="calendar-perf-panel">
          <div className="calendar-perf-date">
            {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>

          <div className="calendar-times">
            {selectedPerformance.times.map((performance) => (
              <button
                key={performance.time}
                onClick={() =>
                  onSelectPerformance?.(selectedDate!, performance.time, performance.type)
                }
                disabled={performance.available === 0}
                className={`calendar-time-btn ${
                  performance.available === 0
                    ? 'calendar-time-disabled'
                    : 'calendar-time-enabled'
                }`}
              >
                <div className="calendar-time-row">
                  <div className="calendar-time-meta">
                    {performance.type === 'matinee' ? (
                      <Sun className="icon-md-spotlight" />
                    ) : (
                      <Moon className="icon-md-spotlight" />
                    )}
                    <div>
                      <div className="calendar-time-type">{performance.type}</div>
                      <div className="calendar-time-value">{performance.time}</div>
                    </div>
                  </div>

                  <div className="calendar-time-availability">
                    {performance.available > 0 ? (
                      <>
                        <div className="calendar-seats">{performance.available} seats</div>
                        <div className="calendar-available">Available</div>
                      </>
                    ) : (
                      <div className="calendar-soldout">Sold Out</div>
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
