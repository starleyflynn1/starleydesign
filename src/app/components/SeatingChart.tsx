import { useEffect, useMemo, useState } from 'react';
import { Accessibility, Bug, Settings2, X } from 'lucide-react';

type SeatStatus = 'available' | 'unavailable' | 'vip' | 'accessible' | 'selected';
type SectionType = 'standard' | 'vip' | 'accessible' | 'mixed';
type AssignmentType = Exclude<SeatStatus, 'selected'>;

interface Seat {
  id: string;
  row: string;
  number: number;
  colIndex: number;
  status: SeatStatus;
  price?: number;
}

interface SeatingChartProps {
  section: string;
  onSeatSelect?: (seats: Seat[]) => void;
}

const seatColors = {
  available: 'seating-seat-available',
  unavailable: 'seating-seat-taken',
  vip: 'seating-seat-vip',
  accessible: 'seating-seat-accessible',
  selected: 'seating-seat-selected',
};

const DEFAULT_SECTION_TYPES: { left: SectionType; center: SectionType; right: SectionType } = {
  left: 'mixed',
  center: 'vip',
  right: 'mixed',
};

export function SeatingChart({ section, onSeatSelect }: SeatingChartProps) {
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [seatLiveMessage, setSeatLiveMessage] = useState('');
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [motionTooltipSeat, setMotionTooltipSeat] = useState<Seat | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [focusedSeatId, setFocusedSeatId] = useState<string | null>(null);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [suggestedSeatIds, setSuggestedSeatIds] = useState<string[]>([]);
  const [ticketCount, setTicketCount] = useState(2);
  const [rowCount, setRowCount] = useState(10);
  const [seatsPerRow, setSeatsPerRow] = useState(8);
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('available');
  const [seatOverrides, setSeatOverrides] = useState<Record<string, AssignmentType>>({});
  const [sectionTypes, setSectionTypes] = useState<{ left: SectionType; center: SectionType; right: SectionType }>(
    DEFAULT_SECTION_TYPES
  );

  const generateSeats = (
    rowCountValue: number,
    seatsPerRowValue: number,
    sectionTypesValue: { left: SectionType; center: SectionType; right: SectionType }
  ): Seat[] => {
    const rows = Array.from({ length: rowCountValue }, (_, index) => String.fromCharCode(65 + index));
    const seats: Seat[] = [];
    const vipStart = Math.max(2, Math.floor(rowCountValue * 0.25));
    const vipEnd = Math.min(rowCountValue - 2, Math.floor(rowCountValue * 0.65));
    const vipSeatStart = Math.max(3, Math.floor(seatsPerRowValue * 0.32));
    const vipSeatEnd = Math.min(seatsPerRowValue - 2, Math.ceil(seatsPerRowValue * 0.72));
    const firstAisle = Math.max(3, Math.floor(seatsPerRowValue / 3));
    const secondAisle = Math.min(seatsPerRowValue - 2, Math.floor((seatsPerRowValue * 2) / 3));

    rows.forEach((row, rowIndex) => {
      for (let i = 1; i <= seatsPerRowValue; i++) {
        const isAisleAdjacent = i === firstAisle || i === firstAisle + 1 || i === secondAisle || i === secondAisle + 1;
        const isEdgeAccessible = (rowIndex === 0 || rowIndex === rows.length - 1) && (i === 1 || i === seatsPerRowValue);
        const isExtraAccessible = isAisleAdjacent && (rowIndex <= 1 || rowIndex >= rows.length - 2);
        const isAccessible = isEdgeAccessible || isExtraAccessible;
        const isVIP = rowIndex >= vipStart && rowIndex <= vipEnd && i >= vipSeatStart && i <= vipSeatEnd;
        const isTaken = (rowIndex * 17 + i * 13) % 10 < 3;
        const sectionType =
          i <= firstAisle
            ? sectionTypesValue.left
            : i <= secondAisle
            ? sectionTypesValue.center
            : sectionTypesValue.right;

        let status: SeatStatus = 'available';
        if (isAccessible || sectionType === 'accessible') status = 'accessible';
        else if (sectionType === 'vip') status = 'vip';
        else if (sectionType === 'standard') status = isTaken ? 'unavailable' : 'available';
        else if (isVIP) status = 'vip';
        else if (isTaken) status = 'unavailable';

        seats.push({
          id: `${row}${i}`,
          row,
          number: i,
          colIndex: i - 1,
          status,
          price: isVIP ? 150 : isAccessible ? 80 : 100,
        });
      }
    });

    return seats;
  };

  const generatedSeats = useMemo(
    () => generateSeats(rowCount, seatsPerRow, sectionTypes),
    [rowCount, seatsPerRow, sectionTypes]
  );

  const seats = useMemo(() => {
    return generatedSeats.map((seat) => {
      const override = seatOverrides[seat.id];
      if (!override) return seat;
      return {
        ...seat,
        status: override,
        price: override === 'vip' ? 150 : override === 'accessible' ? 80 : 100,
      };
    });
  }, [generatedSeats, seatOverrides]);

  useEffect(() => {
    setSelectedSeats((prev) => {
      const filtered = prev.filter((selectedSeat) => seats.some((seat) => seat.id === selectedSeat.id));
      if (filtered.length !== prev.length) onSeatSelect?.(filtered);
      return filtered;
    });
    setSuggestedSeatIds((prev) => prev.filter((id) => seats.some((seat) => seat.id === id)));
    if (focusedSeatId && !seats.some((seat) => seat.id === focusedSeatId)) {
      setFocusedSeatId(null);
    }
    setSeatOverrides((prev) => {
      const validIds = new Set(seats.map((seat) => seat.id));
      const nextEntries = Object.entries(prev).filter(([id]) => validIds.has(id));
      return nextEntries.length === Object.keys(prev).length ? prev : Object.fromEntries(nextEntries);
    });
    if (focusedSeatId === null) {
      const firstFocusable = seats.find((seat) => seat.status !== 'unavailable');
      if (firstFocusable) setFocusedSeatId(firstFocusable.id);
    }
  }, [seats, focusedSeatId]);

  useEffect(() => {
    if (selectedSeats.length === 0) return;
    const clampedCount = Math.max(1, Math.min(6, selectedSeats.length));
    setTicketCount(clampedCount);
  }, [selectedSeats.length]);

  const announceSeatSelectionChange = (previousSelection: Seat[], nextSelection: Seat[], triggerSeat: Seat) => {
    const wasSelected = previousSelection.some((seat) => seat.id === triggerSeat.id);
    const isSelected = nextSelection.some((seat) => seat.id === triggerSeat.id);
    if (wasSelected === isSelected) return;

    const action = isSelected ? 'selected' : 'deselected';
    setSeatLiveMessage(
      `${getSeatLocationLabel(triggerSeat)} ${action}. ${nextSelection.length} seat${nextSelection.length === 1 ? '' : 's'} selected.`
    );
  };

  const handleSeatClick = (seat: Seat, isRangeSelect = false) => {
    const isUnavailable = seat.status === 'unavailable';
    if (isUnavailable && !isToolsOpen) return;

    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);

    let newSelectedSeats: Seat[];
    if (isAlreadySelected && !isRangeSelect) {
      newSelectedSeats = selectedSeats.filter((s) => s.id !== seat.id);
    } else if (!isAlreadySelected) {
      newSelectedSeats = [...selectedSeats, seat];
    } else {
      newSelectedSeats = selectedSeats;
    }

    announceSeatSelectionChange(selectedSeats, newSelectedSeats, seat);
    setSelectedSeats(newSelectedSeats);
    onSeatSelect?.(newSelectedSeats);
  };

  const getSeatStatus = (seat: Seat): SeatStatus => {
    if (selectedSeats.some((s) => s.id === seat.id)) return 'selected';
    return seat.status;
  };

  const seatsById = useMemo(() => {
    return new Map(seats.map((seat) => [seat.id, seat]));
  }, [seats]);

  const rows = Array.from(new Set(seats.map((s) => s.row)));
  const aisleBreaks = useMemo(() => {
    const first = Math.max(3, Math.floor(seatsPerRow / 3));
    const second = Math.min(seatsPerRow - 2, Math.floor((seatsPerRow * 2) / 3));
    return first === second ? [first] : [first, second];
  }, [seatsPerRow]);
  const stageWidthPx = useMemo(() => {
    const stageStartSeat = 2;
    const stageEndSeat = Math.max(stageStartSeat, seatsPerRow - 1);
    const seatCount = stageEndSeat - stageStartSeat + 1;
    const seatSizePx = 32; // matches `w-8`
    const seatGapPx = 8; // matches `gap-2`
    const aisleWidthPx = 32; // base `w-8`
    const aisleCount = aisleBreaks.filter((breakSeat) => breakSeat >= stageStartSeat && breakSeat < stageEndSeat).length;

    return seatCount * seatSizePx + (seatCount - 1) * seatGapPx + aisleCount * aisleWidthPx;
  }, [seatsPerRow, aisleBreaks]);

  const getSeatLocationLabel = (seat: Seat) => `Row ${seat.row}, Seat ${seat.number}`;

  const findSuggestedSeatIds = (count: number): string[] => {
    if (count <= 0) return [];
    const sortedRows = [...rows].sort();
    const centerSeat = (seatsPerRow + 1) / 2;
    // Slightly forward-center is typically the best compromise for theater viewing.
    const targetRowIndex = Math.round((sortedRows.length - 1) * 0.35);

    type Candidate = { ids: string[]; score: number };
    let best: Candidate | null = null;

    for (let rowIndex = 0; rowIndex < sortedRows.length; rowIndex++) {
      const row = sortedRows[rowIndex];
      const rowSeats = seats
        .filter((seat) => seat.row === row)
        .sort((a, b) => a.number - b.number)
        .filter((seat) => seat.status !== 'unavailable');

      for (let start = 0; start <= rowSeats.length - count; start++) {
        const group = rowSeats.slice(start, start + count);
        const contiguous = group.every((seat, idx) => idx === 0 || seat.number === group[idx - 1].number + 1);
        if (!contiguous) continue;

        const groupCenterSeat = group[Math.floor(group.length / 2)].number;
        const centerDistance = Math.abs(groupCenterSeat - centerSeat);
        const rowDistance = Math.abs(rowIndex - targetRowIndex);
        const vipCount = group.filter((seat) => seat.status === 'vip').length;
        const accessibleCount = group.filter((seat) => seat.status === 'accessible').length;

        // Score model:
        // - Strongly favor center alignment (viewing angle)
        // - Favor target distance from stage (not too close/far)
        // - Prefer VIP seats when they still satisfy angle/proximity
        // - Slightly de-prioritize accessible seats for generic auto-suggest
        const score =
          100
          - centerDistance * 15
          - rowDistance * 9
          + vipCount * 12
          - accessibleCount * 3;

        if (!best || score > best.score) {
          best = { ids: group.map((seat) => seat.id), score };
        }
      }
    }

    return best?.ids ?? [];
  };

  const handleSuggestBest = () => {
    const suggested = findSuggestedSeatIds(ticketCount);
    setSuggestedSeatIds(suggested);
    if (suggested.length === 0) return;
    const nextSelection = suggested.map((id) => seatsById.get(id)).filter(Boolean) as Seat[];
    setSelectedSeats(nextSelection);
    setSeatLiveMessage(`Suggested ${nextSelection.length} seat${nextSelection.length === 1 ? '' : 's'} and selected them.`);
    onSeatSelect?.(nextSelection);
  };

  const applyAssignmentType = () => {
    if (selectedSeats.length === 0) return;
    setSeatOverrides((prev) => {
      const next = { ...prev };
      selectedSeats.forEach((seat) => {
        next[seat.id] = assignmentType;
      });
      return next;
    });
    setSelectedSeats([]);
    setSuggestedSeatIds([]);
    setSeatLiveMessage(`Applied ${assignmentType} assignment to selected seats.`);
    onSeatSelect?.([]);
  };

  const resetAssignments = () => {
    setSeatOverrides({});
    setSectionTypes(DEFAULT_SECTION_TYPES);
    setSelectedSeats([]);
    setSuggestedSeatIds([]);
    setSeatLiveMessage('Seat assignments reset.');
    onSeatSelect?.([]);
  };

  const handleSeatKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, seat: Seat) => {
    const key = event.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(key)) return;

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      handleSeatClick(seat);
      return;
    }

    event.preventDefault();
    const currentRowIdx = rows.indexOf(seat.row);
    let nextRowIdx = currentRowIdx;
    let nextCol = seat.colIndex;

    if (key === 'ArrowRight') nextCol += 1;
    if (key === 'ArrowLeft') nextCol -= 1;
    if (key === 'ArrowDown') nextRowIdx += 1;
    if (key === 'ArrowUp') nextRowIdx -= 1;

    const nextRow = rows[nextRowIdx];
    if (!nextRow) return;

    const nextSeat = seats.find((candidate) => candidate.row === nextRow && candidate.colIndex === nextCol);
    if (!nextSeat) return;

    setFocusedSeatId(nextSeat.id);
    const nextSeatButton = document.querySelector<HTMLButtonElement>(`button[data-seat-id="${nextSeat.id}"]`);
    nextSeatButton?.focus();
  };

  return (
    <div
      className="seating-root"
      onMouseUp={() => setIsDragSelecting(false)}
      onMouseLeave={() => setIsDragSelecting(false)}
    >
      <div className="seating-stage-wrap">
        {!isToolsOpen && (
          <div className="seating-tools-row">
            <button
              className="seating-tools-btn seating-tools-btn-desktop"
              type="button"
              onClick={() => setIsToolsOpen(true)}
              aria-pressed={false}
              title="Open seating tools"
            >
              <Settings2 className="w-4 h-4" />
              Tools
            </button>
          </div>
        )}
        <div className="seating-stage-topbar">
          <div className="seating-stage" style={{ width: `${stageWidthPx}px` }}>
            <span className="seating-stage-label">Stage</span>
          </div>
        </div>
      </div>

      <p id="seating-grid-help" className="sr-only">
        Seating chart keyboard controls: use arrow keys to move between seats, and press Enter or Space to select a seat.
      </p>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {seatLiveMessage}
      </p>
      <div className="seating-grid" role="grid" aria-label="Interactive seating chart" aria-describedby="seating-grid-help">
        {rows.map((row, rowIndex) => {
          return (
            <div key={row} className="seating-row" role="row" aria-label={`Row ${row}`}>
              <div className="seating-row-label">{row}</div>
              <div className="seating-row-seats" role="row">
                {seats
                  .filter((s) => s.row === row)
                  .sort((a, b) => a.number - b.number)
                  .map((seat) => {
                  const displayStatus = getSeatStatus(seat);
                  const isAccessible = seat.status === 'accessible';
                  const isVIP = seat.status === 'vip';
                  const isUnavailable = seat.status === 'unavailable';
                  const isSuggested = suggestedSeatIds.includes(seat.id);
                  const showAisleAfter = aisleBreaks.includes(seat.number);
                  const isLeftAisle = seat.number === aisleBreaks[0];

                  return (
                    <div key={seat.id} className="seating-seat-wrap">
                      <button
                        data-seat-id={seat.id}
                        onMouseDown={() => {
                          setIsDragSelecting(true);
                          handleSeatClick(seat, false);
                        }}
                        onMouseEnter={() => {
                          if (isDragSelecting) handleSeatClick(seat, true);
                        }}
                        onMouseMove={(event) => {
                          setMotionTooltipSeat(seat);
                          setTooltipPosition({ x: event.clientX, y: event.clientY });
                        }}
                        onMouseLeave={() => {
                          setMotionTooltipSeat(null);
                        }}
                        onFocus={() => {
                          setFocusedSeatId(seat.id);
                          setMotionTooltipSeat(seat);
                        }}
                        onBlur={() => {
                          setMotionTooltipSeat(null);
                        }}
                        onKeyDown={(event) => handleSeatKeyDown(event, seat)}
                        onClick={(event) => {
                          // Keyboard-triggered click (Enter/Space) has detail=0.
                          if (event.detail === 0) handleSeatClick(seat);
                        }}
                        disabled={isUnavailable && !isToolsOpen}
                        className={`seating-seat-btn ${seatColors[displayStatus]} ${isSuggested ? 'seating-seat-suggested' : ''} ${focusedSeatId === seat.id ? 'seating-seat-focused' : ''}`}
                        title={`${getSeatLocationLabel(seat)} - $${seat.price} - ${displayStatus}`}
                        aria-label={`${getSeatLocationLabel(seat)}, ${displayStatus}, $${seat.price}`}
                        role="gridcell"
                        aria-selected={displayStatus === 'selected'}
                        aria-disabled={isUnavailable && !isToolsOpen}
                        tabIndex={focusedSeatId === null || focusedSeatId === seat.id ? 0 : -1}
                        style={isUnavailable && !isToolsOpen ? { cursor: 'not-allowed' } : undefined}
                      >
                        {isAccessible && <Accessibility className="seating-accessible-icon" />}
                        {isVIP && <span className="seating-seat-symbol">V</span>}
                        {isUnavailable && <span className="seating-seat-symbol">X</span>}
                      </button>
                      {showAisleAfter && (
                        <div
                          className={`seating-aisle-gap ${isLeftAisle ? 'seating-aisle-gap-left' : 'seating-aisle-gap-right'}`}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="seating-row-label">{row}</div>
            </div>
          );
        })}
      </div>

      {motionTooltipSeat && (
        <div
          className="seating-tooltip"
          style={{ left: `${tooltipPosition.x + 12}px`, top: `${tooltipPosition.y + 12}px` }}
          role="status"
          aria-live="polite"
        >
          <div>{getSeatLocationLabel(motionTooltipSeat)}</div>
          <div>${motionTooltipSeat.price}</div>
        </div>
      )}

      <div className="seating-legend">
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-available"></div>
          <span className="seating-legend-label">Available</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-vip"></div>
          <span className="seating-legend-label">VIP (V)</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-accessible"></div>
          <span className="seating-legend-label">Accessible</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-taken"></div>
          <span className="seating-legend-label">Unavailable (X)</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-selected"></div>
          <span className="seating-legend-label">Selected</span>
        </div>
      </div>

      <aside className={`seating-tools-sidebar ${isToolsOpen ? 'seating-tools-sidebar-open' : 'seating-tools-sidebar-closed'}`}>
          <div className="seating-tools-header">
            <div className="seating-tools-title">Seating Tools</div>
            <div className="seating-tools-actions">
              <button
                className={`seating-debug-toggle ${isDebugMode ? 'seating-debug-toggle-on' : ''}`}
                type="button"
                onClick={() => setIsDebugMode((prev) => !prev)}
                aria-pressed={isDebugMode}
                title="Toggle debug mode"
              >
                <Bug className="w-4 h-4" />
                Debug
              </button>
              <button
                type="button"
                className="seating-tools-close"
                onClick={() => setIsToolsOpen(false)}
                aria-label="Close seating tools"
                title="Close seating tools"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="seating-tools-grid">
            <label className="seating-ticket-count-label">
              Rows
              <select
                value={rowCount}
                onChange={(event) => setRowCount(Number(event.target.value))}
                className="seating-ticket-count-select"
              >
                {[6, 7, 8, 9, 10, 11, 12].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <label className="seating-ticket-count-label">
              Seats/Row
              <select
                value={seatsPerRow}
                onChange={(event) => setSeatsPerRow(Number(event.target.value))}
                className="seating-ticket-count-select"
              >
                {[8, 10, 12, 14, 16, 18].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <label className="seating-ticket-count-label">
              Left Section
              <select
                value={sectionTypes.left}
                onChange={(event) =>
                  setSectionTypes((prev) => ({ ...prev, left: event.target.value as SectionType }))
                }
                className="seating-ticket-count-select"
              >
                <option value="mixed">Mixed</option>
                <option value="standard">Standard</option>
                <option value="vip">VIP</option>
                <option value="accessible">Accessible</option>
              </select>
            </label>
            <label className="seating-ticket-count-label">
              Center Section
              <select
                value={sectionTypes.center}
                onChange={(event) =>
                  setSectionTypes((prev) => ({ ...prev, center: event.target.value as SectionType }))
                }
                className="seating-ticket-count-select"
              >
                <option value="mixed">Mixed</option>
                <option value="standard">Standard</option>
                <option value="vip">VIP</option>
                <option value="accessible">Accessible</option>
              </select>
            </label>
            <label className="seating-ticket-count-label">
              Right Section
              <select
                value={sectionTypes.right}
                onChange={(event) =>
                  setSectionTypes((prev) => ({ ...prev, right: event.target.value as SectionType }))
                }
                className="seating-ticket-count-select"
              >
                <option value="mixed">Mixed</option>
                <option value="standard">Standard</option>
                <option value="vip">VIP</option>
                <option value="accessible">Accessible</option>
              </select>
            </label>
            <div className="seating-assignment-tools">
              <div className="seating-tools-subtitle">
                Seat Assignment ({selectedSeats.length} selected)
              </div>
              {selectedSeats.length === 0 && (
                <div className="seating-tools-hint">Select seats on the chart to assign a type.</div>
              )}
              <label className="seating-ticket-count-label">
                Assignment Type
                <select
                  value={assignmentType}
                  onChange={(event) => setAssignmentType(event.target.value as AssignmentType)}
                  className="seating-ticket-count-select"
                >
                  <option value="available">Available</option>
                  <option value="vip">VIP</option>
                  <option value="accessible">Accessible</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </label>
              <button
                type="button"
                className={`seating-assign-btn ${selectedSeats.length === 0 ? 'seating-assign-btn-disabled' : ''}`}
                onClick={applyAssignmentType}
                disabled={selectedSeats.length === 0}
                title={selectedSeats.length === 0 ? 'Select seat(s) to enable assignment' : `Apply to ${selectedSeats.length} selected seat(s)`}
              >
                Apply
              </button>
              {selectedSeats.length > 0 && (
                <div className="seating-tools-selected-list">
                  {selectedSeats.map((seat) => seat.id).join(', ')}
                </div>
              )}
            </div>
            <button type="button" className="seating-reset-btn" onClick={resetAssignments}>
              Reset Assignments
            </button>
          </div>

          {isDebugMode && (
            <pre className="seating-debug-panel">
              {JSON.stringify(
                {
                  section,
                  selectedSeatIds: selectedSeats.map((seat) => seat.id),
                  focusedSeatId,
                  suggestedSeatIds,
                  rowCount,
                  seatsPerRow,
                  sectionTypes,
                  pointerTooltip: motionTooltipSeat ? motionTooltipSeat.id : null,
                  assignmentType,
                  seatOverrides,
                  coordinates: seats.slice(0, 12).map((seat) => ({
                    id: seat.id,
                    row: seat.row,
                    colIndex: seat.colIndex,
                  })),
                },
                null,
                2
              )}
            </pre>
          )}
      </aside>

      <div className="seating-controls">
        {!isToolsOpen && (
          <button
            className="seating-tools-btn seating-tools-btn-mobile"
            type="button"
            onClick={() => setIsToolsOpen(true)}
            aria-pressed={false}
            title="Open seating tools"
          >
            <Settings2 className="w-4 h-4" />
            Tools
          </button>
        )}
        <label className="seating-ticket-count-label">
          Tickets
          <select
            value={ticketCount}
            onChange={(event) => setTicketCount(Number(event.target.value))}
            className="seating-ticket-count-select"
          >
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
        <button className="seating-suggest-btn" type="button" onClick={handleSuggestBest}>
          Suggest Best Seats
        </button>
        <button className="seating-reset-btn" type="button" onClick={resetAssignments}>
          Reset
        </button>
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
