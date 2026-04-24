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
  available: 'bg-seat-available hover:bg-seat-available/80 cursor-pointer',
  taken: 'bg-seat-taken cursor-not-allowed opacity-50',
  vip: 'bg-seat-vip hover:bg-seat-vip/80 cursor-pointer ring-2 ring-spotlight',
  accessible: 'bg-seat-accessible hover:bg-seat-accessible/80 cursor-pointer',
  selected: 'bg-accent-primary ring-2 ring-spotlight cursor-pointer',
};

export function SeatingChart({ section, onSeatSelect }: SeatingChartProps) {
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
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-block px-8 py-2 bg-gradient-to-b from-spotlight/30 to-transparent rounded-t-lg border-t-2 border-spotlight/50">
          <span className="text-sm uppercase tracking-wider text-spotlight">Stage</span>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-center gap-2">
            <div className="w-8 text-center text-sm text-spotlight/70">{row}</div>
            <div className="flex gap-2">
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
                      className={`relative w-8 h-8 rounded-md transition-all ${seatColors[displayStatus]}`}
                      title={`${seat.row}${seat.number} - $${seat.price} - ${displayStatus}`}
                    >
                      {isAccessible && (
                        <Accessibility className="w-4 h-4 absolute inset-0 m-auto text-white" />
                      )}
                    </button>
                  );
                })}
            </div>
            <div className="w-8 text-center text-sm text-spotlight/70">{row}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 pt-4 border-t border-spotlight/20">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-seat-available"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-seat-vip ring-2 ring-spotlight"></div>
          <span className="text-sm">VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-seat-accessible"></div>
          <span className="text-sm">Accessible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-seat-taken opacity-50"></div>
          <span className="text-sm">Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent-primary ring-2 ring-spotlight"></div>
          <span className="text-sm">Selected</span>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="p-4 bg-spotlight/10 rounded-lg border border-spotlight/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Selected Seats</div>
              <div className="flex gap-2 mt-1">
                {selectedSeats.map((seat) => (
                  <span key={seat.id} className="px-2 py-1 bg-stage-depth rounded text-sm">
                    {seat.id}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-xl text-spotlight">
                ${selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
