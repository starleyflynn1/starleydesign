import { useState } from 'react';
import { Accessibility } from 'lucide-react';

type SeatStatus = 'available' | 'taken' | 'vip' | 'accessible' | 'selected';

interface Seat {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
  price?: number;
}

interface SeatingChartProps {
  section: string;
  onSeatSelect?: (seats: Seat[]) => void;
}

const seatColors = {
  available: 'seating-seat-available',
  taken: 'seating-seat-taken',
  vip: 'seating-seat-vip',
  accessible: 'seating-seat-accessible',
  selected: 'seating-seat-selected',
};

export function SeatingChart({ section, onSeatSelect }: SeatingChartProps) {
  void section;
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  const generateSeats = (): Seat[] => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const seatsPerRow = 12;
    const seats: Seat[] = [];

    rows.forEach((row, rowIndex) => {
      for (let i = 1; i <= seatsPerRow; i++) {
        const isAccessible = (rowIndex === 0 || rowIndex === rows.length - 1) && (i === 1 || i === seatsPerRow);
        const isVIP = rowIndex >= 2 && rowIndex <= 4 && i >= 4 && i <= 9;
        const isTaken = Math.random() > 0.7;

        let status: SeatStatus = 'available';
        if (isTaken && !isVIP && !isAccessible) status = 'taken';
        else if (isVIP) status = 'vip';
        else if (isAccessible) status = 'accessible';

        seats.push({
          id: `${row}${i}`,
          row,
          number: i,
          status,
          price: isVIP ? 150 : isAccessible ? 80 : 100,
        });
      }
    });

    return seats;
  };

  const [seats] = useState(generateSeats());

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'taken') return;

    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);

    let newSelectedSeats: Seat[];
    if (isAlreadySelected) {
      newSelectedSeats = selectedSeats.filter((s) => s.id !== seat.id);
    } else {
      newSelectedSeats = [...selectedSeats, seat];
    }

    setSelectedSeats(newSelectedSeats);
    onSeatSelect?.(newSelectedSeats);
  };

  const getSeatStatus = (seat: Seat): SeatStatus => {
    if (selectedSeats.some((s) => s.id === seat.id)) return 'selected';
    return seat.status;
  };

  const rows = Array.from(new Set(seats.map((s) => s.row)));

  return (
    <div className="seating-root">
      <div className="seating-stage-wrap">
        <div className="seating-stage">
          <span className="seating-stage-label">Stage</span>
        </div>
      </div>

      <div className="seating-grid">
        {rows.map((row) => (
          <div key={row} className="seating-row">
            <div className="seating-row-label">{row}</div>
            <div className="seating-row-seats">
              {seats
                .filter((s) => s.row === row)
                .map((seat) => {
                  const displayStatus = getSeatStatus(seat);
                  const isAccessible = seat.status === 'accessible';

                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'taken'}
                      className={`seating-seat-btn ${seatColors[displayStatus]}`}
                      title={`${seat.row}${seat.number} - $${seat.price} - ${displayStatus}`}
                    >
                      {isAccessible && (
                        <Accessibility className="seating-accessible-icon" />
                      )}
                    </button>
                  );
                })}
            </div>
            <div className="seating-row-label">{row}</div>
          </div>
        ))}
      </div>

      <div className="seating-legend">
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-available"></div>
          <span className="seating-legend-label">Available</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-vip"></div>
          <span className="seating-legend-label">VIP</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-accessible"></div>
          <span className="seating-legend-label">Accessible</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-taken"></div>
          <span className="seating-legend-label">Taken</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-selected"></div>
          <span className="seating-legend-label">Selected</span>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="seating-summary">
          <div className="seating-summary-row">
            <div>
              <div className="seating-summary-label">Selected Seats</div>
              <div className="seating-summary-tags">
                {selectedSeats.map((seat) => (
                  <span key={seat.id} className="seating-seat-tag">
                    {seat.id}
                  </span>
                ))}
              </div>
            </div>
            <div className="seating-total-wrap">
              <div className="seating-summary-label">Total</div>
              <div className="seating-total-value">
                ${selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
