import React, { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Accessibility, Bug, Code2, Copy, Network, Settings2, X } from 'lucide-react';

type SeatStatus = 'available' | 'unavailable' | 'vip' | 'accessible' | 'selected';
type SectionType = 'standard' | 'vip' | 'accessible' | 'mixed';
type AssignmentType = Exclude<SeatStatus, 'selected'>;

function formatSeatStatusForAria(status: SeatStatus): string {
  switch (status) {
    case 'vip':
      return 'VIP';
    case 'accessible':
      return 'Accessible';
    case 'unavailable':
      return 'Unavailable';
    case 'selected':
      return 'Selected';
    case 'available':
    default:
      return 'Available';
  }
}

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
  hideTools?: boolean;
  hideSummary?: boolean;
  compactMode?: boolean;
  hideQuickControls?: boolean;
  ticketCount?: number;
  onTicketCountChange?: (count: number) => void;
  suggestRequestKey?: number;
  resetRequestKey?: number;
}

const seatColors = {
  available: 'seating-seat-available',
  unavailable: 'seating-seat-taken',
  vip: 'seating-seat-vip',
  accessible: 'seating-seat-accessible',
  selected: 'seating-seat-selected',
};

/** Defer geometry reads until after the next paint so they do not run in the same turn as layout-invalidating writes (forced reflow). */
function runAfterNextPaint(run: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

const DEFAULT_SECTION_TYPES: { left: SectionType; center: SectionType; right: SectionType } = {
  left: 'mixed',
  center: 'vip',
  right: 'mixed',
};

/** Row labels A–Z, then AA, AB, … so large grids do not reuse single-letter codes past Z. */
function rowLabelFromIndex(index: number): string {
  let n = index;
  let label = '';
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

const SOLD_GROUP_SIZES = [2, 3, 4] as const;

function isProtectedSeat(s: Seat): boolean {
  return s.status === 'accessible' || s.status === 'vip';
}

/** VIP “sold” blocks: sizes 2–4 with gaps between clusters; trailing lone VIP usually merged into sold. */
function applyGappedUnavailableOnVipSegment(segment: Seat[], seed: number): void {
  if (segment.length < 2) return;
  let idx = 0;
  let localSeed = (seed ^ segment.length * 131) >>> 0;
  while (idx + 2 <= segment.length) {
    const groupSize = SOLD_GROUP_SIZES[localSeed % 3];
    const remaining = segment.length - idx;
    const runLen = Math.min(groupSize, remaining);
    if (runLen < 2) {
      idx += 1;
      localSeed = (localSeed * 17 + 1) >>> 0;
      continue;
    }
    for (let k = 0; k < runLen; k++) {
      segment[idx + k].status = 'unavailable';
    }
    idx += runLen;
    if (idx >= segment.length) break;
    const gap = 2 + (localSeed % 4);
    idx += gap;
    localSeed = (localSeed * 1103515245 + 12345) >>> 0;
  }

  let tail = segment.length - 1;
  while (tail >= 0 && segment[tail].status === 'vip') tail--;
  const trailing = segment.length - 1 - tail;
  if (trailing === 1) {
    const leaveLoneAvailable = ((localSeed ^ segment.length ^ seed) % 7) === 0;
    if (!leaveLoneAvailable) {
      segment[segment.length - 1].status = 'unavailable';
    }
  }
}

/** Standard / mixed sold-hash targets: pack into runs of 2–4 with no gaps; trailing lone usually merged. */
function applyPackedUnavailableOnSoldSegment(segment: Seat[], rowSeed: number): void {
  if (segment.length < 2) return;
  let idx = 0;
  let localSeed = (rowSeed ^ segment.length * 131) >>> 0;
  while (idx < segment.length) {
    const remaining = segment.length - idx;
    if (remaining === 1) break;
    const pick = SOLD_GROUP_SIZES[localSeed % 3];
    let runLen = Math.min(pick, remaining);
    if (remaining - runLen === 1 && runLen >= 3) {
      runLen -= 1;
    }
    if (runLen < 2) runLen = Math.min(2, remaining);
    if (runLen > remaining) runLen = remaining;
    for (let k = 0; k < runLen; k++) {
      segment[idx + k].status = 'unavailable';
    }
    idx += runLen;
    localSeed = (localSeed * 1103515245 + 12345) >>> 0;
  }

  let t = segment.length - 1;
  while (t >= 0 && segment[t].status === 'available') t--;
  const trailingAvailable = segment.length - 1 - t;
  if (trailingAvailable === 1) {
    const leaveLone = ((localSeed ^ segment.length ^ rowSeed) % 7) === 0;
    if (!leaveLone) segment[segment.length - 1].status = 'unavailable';
  }
}

function pairSoldSingletonWithNeighbor(seat: Seat, rowSeats: Seat[], seed: number): void {
  const left = rowSeats.find((s) => s.number === seat.number - 1);
  const right = rowSeats.find((s) => s.number === seat.number + 1);
  const trySeat = (buddy: Seat | undefined): boolean => {
    if (!buddy || buddy.status !== 'available' || isProtectedSeat(buddy)) return false;
    seat.status = 'unavailable';
    buddy.status = 'unavailable';
    return true;
  };
  const order = seed % 2 === 0 ? [left, right] : [right, left];
  for (const buddy of order) {
    if (trySeat(buddy)) return;
  }
  if ((seed ^ seat.number) % 7 !== 0) seat.status = 'unavailable';
}

/** Turn part of each VIP run into unavailable seats in contiguous blocks (sizes 2–4), with gaps between blocks. */
function applyClusteredVipUnavailable(seats: Seat[]): void {
  const byRow = new Map<string, Seat[]>();
  for (const seat of seats) {
    const list = byRow.get(seat.row);
    if (list) list.push(seat);
    else byRow.set(seat.row, [seat]);
  }

  for (const rowSeats of byRow.values()) {
    rowSeats.sort((a, b) => a.number - b.number);
    const vipInOrder = rowSeats.filter((s) => s.status === 'vip');
    if (vipInOrder.length < 2) continue;

    const segments: Seat[][] = [];
    let seg: Seat[] = [];
    for (const s of vipInOrder) {
      if (seg.length === 0 || s.number === seg[seg.length - 1].number + 1) {
        seg.push(s);
      } else {
        segments.push(seg);
        seg = [s];
      }
    }
    if (seg.length) segments.push(seg);

    const rowLabel = rowSeats[0].row;
    let seed = rowLabel.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 0);

    for (const segment of segments) {
      applyGappedUnavailableOnVipSegment(segment, seed);
      seed = (seed * 131 + segment.length) >>> 0;
    }
  }
}

/** Apply the same sold clustering rules to hash-selected standard/mixed seats (no scattered singles). */
function applyClusteredGeneralSold(seats: Seat[], soldIds: Set<string>): void {
  const byRow = new Map<string, Seat[]>();
  for (const seat of seats) {
    const list = byRow.get(seat.row);
    if (list) list.push(seat);
    else byRow.set(seat.row, [seat]);
  }

  for (const rowSeats of byRow.values()) {
    rowSeats.sort((a, b) => a.number - b.number);
    const pool = rowSeats.filter((s) => soldIds.has(s.id) && s.status === 'available');
    if (pool.length === 0) continue;

    const segments: Seat[][] = [];
    let seg: Seat[] = [];
    for (const s of pool) {
      if (seg.length === 0 || s.number === seg[seg.length - 1].number + 1) {
        seg.push(s);
      } else {
        segments.push(seg);
        seg = [s];
      }
    }
    if (seg.length) segments.push(seg);

    const rowLabel = rowSeats[0].row;
    let seed = rowLabel.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 0);

    for (const segment of segments) {
      if (segment.length === 1) {
        pairSoldSingletonWithNeighbor(segment[0], rowSeats, seed);
      } else {
        applyPackedUnavailableOnSoldSegment(segment, seed);
      }
      seed = (seed * 131 + segment.length) >>> 0;
    }
  }
}

const ROW_COUNT_OPTIONS = Array.from({ length: 25 }, (_, i) => i + 6);
/** Wide orchestra-style sections often run 40–60+ seats across; cap keeps selects usable. */
const SEATS_PER_ROW_OPTIONS = [
  8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 44, 48, 52, 56, 60,
];

export function SeatingChart({
  section,
  onSeatSelect,
  hideTools = false,
  hideSummary = false,
  compactMode = false,
  hideQuickControls = false,
  ticketCount: controlledTicketCount,
  onTicketCountChange,
  suggestRequestKey,
  resetRequestKey,
}: SeatingChartProps) {
  const fitViewportRef = useRef<HTMLDivElement | null>(null);
  const fitContentRef = useRef<HTMLDivElement | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [seatLiveMessage, setSeatLiveMessage] = useState('');
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isLogicOpen, setIsLogicOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState<string | null>(null);
  const [applyHint, setApplyHint] = useState<string | null>(null);
  const applyHintTimeoutRef = useRef<number | null>(null);
  const [seatHoverTooltip, setSeatHoverTooltip] = useState<Seat | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [focusedSeatId, setFocusedSeatId] = useState<string | null>(null);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedSeatIds, setSuggestedSeatIds] = useState<string[]>([]);
  const [ticketCountState, setTicketCountState] = useState(2);
  const [rowCount, setRowCount] = useState(25);
  const [seatsPerRow, setSeatsPerRow] = useState(30);
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('available');
  const [seatOverrides, setSeatOverrides] = useState<Record<string, AssignmentType>>({});
  const [sectionTypes, setSectionTypes] = useState<{ left: SectionType; center: SectionType; right: SectionType }>(
    DEFAULT_SECTION_TYPES
  );
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );
  const [isFitOverview, setIsFitOverview] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );
  const [fitScale, setFitScale] = useState(1);
  const [fitScaledBox, setFitScaledBox] = useState<{ w: number; h: number } | null>(null);
  const recalcFitScaleRef = useRef<() => void>(() => {});
  const ticketCount = controlledTicketCount ?? ticketCountState;
  const updateTicketCount = (count: number) => {
    if (typeof controlledTicketCount === 'number') {
      onTicketCountChange?.(count);
      return;
    }
    setTicketCountState(count);
  };

  const generateSeats = (
    rowCountValue: number,
    seatsPerRowValue: number,
    sectionTypesValue: { left: SectionType; center: SectionType; right: SectionType }
  ): Seat[] => {
    const rows = Array.from({ length: rowCountValue }, (_, index) => rowLabelFromIndex(index));
    const seats: Seat[] = [];
    const vipStart = Math.max(2, Math.floor(rowCountValue * 0.25));
    const vipEnd = Math.min(rowCountValue - 2, Math.floor(rowCountValue * 0.65));
    const vipSeatStart = Math.max(3, Math.floor(seatsPerRowValue * 0.32));
    const vipSeatEnd = Math.min(seatsPerRowValue - 2, Math.ceil(seatsPerRowValue * 0.72));
    const firstAisle = Math.max(3, Math.floor(seatsPerRowValue / 3));
    const secondAisle = Math.min(seatsPerRowValue - 2, Math.floor((seatsPerRowValue * 2) / 3));

    const soldHashTargets = new Set<string>();

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
        else if (sectionType === 'standard') {
          if (isTaken) soldHashTargets.add(`${row}${i}`);
          status = 'available';
        } else if (isVIP) status = 'vip';
        else if (isTaken) {
          soldHashTargets.add(`${row}${i}`);
          status = 'available';
        }

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

    applyClusteredVipUnavailable(seats);
    applyClusteredGeneralSold(seats, soldHashTargets);

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
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = () => {
      const mobile = mediaQuery.matches;
      setIsMobileViewport(mobile);
      if (mobile) setIsFitOverview(true);
      else {
        setIsFitOverview(false);
        setFitScale(1);
      }
    };
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileViewport || !isFitOverview) {
      setFitScale(1);
      setFitScaledBox(null);
      return;
    }

    const recalc = () => {
      const viewport = fitViewportRef.current;
      const content = fitContentRef.current;
      if (!viewport || !content) return;
      // Leave room for overview padding, borders, and parent card gutters on small screens.
      const horizontalGutter = 20;
      const availableWidth = Math.max(0, viewport.clientWidth - horizontalGutter);
      const stageTopbar = content.querySelector('.seating-stage-topbar') as HTMLElement | null;
      const grid = content.querySelector('.seating-grid') as HTMLElement | null;
      const legend = content.querySelector('.seating-legend') as HTMLElement | null;
      const contentWidth = Math.max(
        content.scrollWidth,
        stageTopbar?.scrollWidth ?? 0,
        grid?.scrollWidth ?? 0,
        legend?.scrollWidth ?? 0
      );
      const contentHeight = Math.max(
        content.scrollHeight,
        stageTopbar?.scrollHeight ?? 0,
        grid?.scrollHeight ?? 0,
        legend?.scrollHeight ?? 0
      );
      if (!contentWidth || !availableWidth) {
        setFitScale(1);
        setFitScaledBox(null);
        return;
      }
      // Fit full width of the house; allow small scales on wide grids (no floor at 0.62 — that forced clipping).
      const fittedScale = (availableWidth / contentWidth) * 0.92;
      const next = Math.min(1, Math.max(0.06, fittedScale));
      if (!Number.isFinite(next)) {
        setFitScale(1);
        setFitScaledBox(null);
        return;
      }
      setFitScale(next);
      // transform: scale() does not shrink layout height — clip to the painted size so scroll parents don't show a tall empty tail.
      setFitScaledBox({
        w: Math.max(0, Math.round(contentWidth * next)),
        h: Math.max(0, Math.round(contentHeight * next)),
      });
    };
    recalcFitScaleRef.current = recalc;

    let rafOuter = 0;
    let rafInner = 0;
    const scheduleRecalc = () => {
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      rafOuter = requestAnimationFrame(() => {
        rafInner = requestAnimationFrame(() => {
          rafOuter = 0;
          rafInner = 0;
          recalc();
        });
      });
    };

    scheduleRecalc();
    window.addEventListener('resize', scheduleRecalc);
    return () => {
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      window.removeEventListener('resize', scheduleRecalc);
    };
  }, [isMobileViewport, isFitOverview, rowCount, seatsPerRow, compactMode, sectionTypes]);
  useEffect(() => {
    if (!isMobileViewport || !isFitOverview) return;
    if (typeof ResizeObserver === 'undefined') return;
    const viewport = fitViewportRef.current;
    if (!viewport) return;

    let rafOuter = 0;
    let rafInner = 0;
    const scheduleRecalc = () => {
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      rafOuter = requestAnimationFrame(() => {
        rafInner = requestAnimationFrame(() => {
          rafOuter = 0;
          rafInner = 0;
          recalcFitScaleRef.current();
        });
      });
    };

    const observer = new ResizeObserver(() => {
      scheduleRecalc();
    });
    observer.observe(viewport);
    return () => {
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      observer.disconnect();
    };
  }, [isMobileViewport, isFitOverview]);
  useEffect(() => {
    if (!isMobileViewport || !isFitOverview) return;
    runAfterNextPaint(() => {
      recalcFitScaleRef.current();
    });
  }, [isMobileViewport, isFitOverview, rowCount, seatsPerRow, sectionTypes]);
  useEffect(() => {
    if (!isMobileViewport || !isFitOverview) return;
    const raf = requestAnimationFrame(() => {
      const viewport = fitViewportRef.current;
      if (viewport) viewport.scrollLeft = 0;
    });
    return () => cancelAnimationFrame(raf);
  }, [isMobileViewport, isFitOverview]);

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
    if (focusedSeatId === null && seats.length > 0) {
      setFocusedSeatId(seats[0].id);
    }
  }, [seats, focusedSeatId]);

  useEffect(() => {
    if (selectedSeats.length === 0) return;
    const clampedCount = Math.max(1, Math.min(6, selectedSeats.length));
    updateTicketCount(clampedCount);
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
    const seatSizePx = compactMode ? 26 : 32;
    const seatGapPx = compactMode ? 6 : 8;
    const aisleWidthPx = compactMode ? 24 : 32;
    const aisleCount = aisleBreaks.filter((breakSeat) => breakSeat >= stageStartSeat && breakSeat < stageEndSeat).length;

    return seatCount * seatSizePx + (seatCount - 1) * seatGapPx + aisleCount * aisleWidthPx;
  }, [seatsPerRow, aisleBreaks, compactMode]);

  const getSeatLocationLabel = (seat: Seat) => `Row ${seat.row}, Seat ${seat.number}`;

  const getSeatAriaLabel = (seat: Seat, displayStatus: SeatStatus) => {
    const pricePart = typeof seat.price === 'number' ? `, $${seat.price}` : '';
    const base = `${getSeatLocationLabel(seat)}, ${formatSeatStatusForAria(displayStatus)}${pricePart}`;
    if (seat.status === 'unavailable' && !isToolsOpen) {
      return `${base}, not available for purchase`;
    }
    return base;
  };

  const findSuggestedSeatIds = (count: number): string[] => {
    if (count <= 0) return [];
    // Preserve stage-to-balcony order (Set order from row-major seats), not lexicographic sort.
    const orderedRows = [...rows];
    const centerSeat = (seatsPerRow + 1) / 2;
    // Slightly forward-center is typically the best compromise for theater viewing.
    const targetRowIndex = Math.round((orderedRows.length - 1) * 0.35);

    type Candidate = { ids: string[]; score: number };
    let bestNonAisle: Candidate | null = null;
    let bestAny: Candidate | null = null;

    for (let rowIndex = 0; rowIndex < orderedRows.length; rowIndex++) {
      const row = orderedRows[rowIndex];
      const rowSeats = seats
        .filter((seat) => seat.row === row)
        .sort((a, b) => a.number - b.number)
        .filter((seat) => seat.status !== 'unavailable');

      for (let start = 0; start <= rowSeats.length - count; start++) {
        const group = rowSeats.slice(start, start + count);
        const contiguous = group.every((seat, idx) => idx === 0 || seat.number === group[idx - 1].number + 1);
        if (!contiguous) continue;
        const minSeat = group[0].number;
        const maxSeat = group[group.length - 1].number;
        const crossesAisle = aisleBreaks.some((breakSeat) => breakSeat >= minSeat && breakSeat < maxSeat);
        const pickedSeatIds = new Set(group.map((seat) => seat.id));
        const remainingSeatNumbers = rowSeats
          .filter((seat) => !pickedSeatIds.has(seat.id))
          .map((seat) => seat.number)
          .sort((a, b) => a - b);

        // Dead-seat prevention:
        // Penalize recommendations that strand isolated single seats in a row,
        // because those are much harder to sell later.
        let deadSeatSingles = 0;
        for (let idx = 0; idx < remainingSeatNumbers.length; idx++) {
          const current = remainingSeatNumbers[idx];
          const previous = remainingSeatNumbers[idx - 1];
          const next = remainingSeatNumbers[idx + 1];
          const hasLeftNeighbor = typeof previous === 'number' && current - previous === 1;
          const hasRightNeighbor = typeof next === 'number' && next - current === 1;
          if (!hasLeftNeighbor && !hasRightNeighbor) deadSeatSingles += 1;
        }

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
          - accessibleCount * 3
          - (crossesAisle ? 60 : 0)
          - deadSeatSingles * 18;

        const candidate = { ids: group.map((seat) => seat.id), score };
        if (!bestAny || score > bestAny.score) {
          bestAny = candidate;
        }
        if (!crossesAisle && (!bestNonAisle || score > bestNonAisle.score)) {
          bestNonAisle = candidate;
        }
      }
    }

    return (bestNonAisle ?? bestAny)?.ids ?? [];
  };

  const scrollSuggestedSeatsIntoView = (seatIds: string[]) => {
    if (typeof document === 'undefined' || seatIds.length === 0) return;
    const midId = seatIds[Math.floor(seatIds.length / 2)];
    runAfterNextPaint(() => {
      runAfterNextPaint(() => {
        const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(midId) : midId;
        document
          .querySelector<HTMLElement>(`button[data-seat-id="${escaped}"]`)
          ?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      });
    });
  };

  const runSuggestBestNow = () => {
    const suggested = findSuggestedSeatIds(ticketCount);
    setSuggestedSeatIds(suggested);
    if (suggested.length === 0) return;
    const nextSelection = suggested.map((id) => seatsById.get(id)).filter(Boolean) as Seat[];
    setSelectedSeats(nextSelection);
    setSeatLiveMessage(`Suggested ${nextSelection.length} seat${nextSelection.length === 1 ? '' : 's'} and selected them.`);
    onSeatSelect?.(nextSelection);
    scrollSuggestedSeatsIntoView(suggested);
  };
  const handleSuggestBest = () => {
    if (isSuggesting) return;
    setIsSuggesting(true);
    window.setTimeout(() => {
      runSuggestBestNow();
      setIsSuggesting(false);
    }, 320);
  };

  const handleViewEntireTheater = () => {
    setIsFitOverview(true);
    runAfterNextPaint(() => {
      runAfterNextPaint(() => {
        recalcFitScaleRef.current();
        runAfterNextPaint(() => {
          const stage = fitContentRef.current?.querySelector<HTMLElement>('.seating-stage-topbar');
          stage?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
        });
      });
    });
  };

  const applyAssignmentType = () => {
    if (selectedSeats.length === 0) {
      setApplyHint('Select seat(s) on the chart to enable Apply.');
      if (applyHintTimeoutRef.current) {
        window.clearTimeout(applyHintTimeoutRef.current);
      }
      applyHintTimeoutRef.current = window.setTimeout(() => {
        setApplyHint(null);
        applyHintTimeoutRef.current = null;
      }, 2200);
      return;
    }
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

  useEffect(() => {
    if (typeof suggestRequestKey !== 'number' || suggestRequestKey <= 0) return;
    runSuggestBestNow();
  }, [suggestRequestKey]);

  useEffect(() => {
    if (typeof resetRequestKey !== 'number' || resetRequestKey <= 0) return;
    resetAssignments();
  }, [resetRequestKey]);

  useEffect(() => {
    if (!isArchitectureOpen && !isLogicOpen && !isDebugMode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsArchitectureOpen(false);
      setIsLogicOpen(false);
      setIsDebugMode(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isArchitectureOpen, isLogicOpen, isDebugMode]);
  useEffect(() => {
    return () => {
      if (applyHintTimeoutRef.current) {
        window.clearTimeout(applyHintTimeoutRef.current);
      }
    };
  }, []);

  const logicCodePlain = `const previous = selectedSeatIds;
setSelectedSeatIds(nextSeatIds); // optimistic
const holdId = crypto.randomUUID();
try {
  await reservationApi.holdSeats({ holdId, seatIds: nextSeatIds });
  bookingStore.commitHold({ holdId, seatIds: nextSeatIds });
} catch (error) {
  setSelectedSeatIds(previous); // rollback
  bookingStore.markConflict(nextSeatIds, error);
}`;

  const debugSnapshot = useMemo(
    () =>
      JSON.stringify(
        {
          section,
          selectedSeatIds: selectedSeats.map((seat) => seat.id),
          focusedSeatId,
          suggestedSeatIds,
          rowCount,
          seatsPerRow,
          sectionTypes,
          pointerTooltip: seatHoverTooltip ? seatHoverTooltip.id : null,
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
      ),
    [assignmentType, focusedSeatId, seatHoverTooltip, rowCount, seatOverrides, section, sectionTypes, seats, seatsPerRow, selectedSeats, suggestedSeatIds]
  );

  const handleCopyPanel = async (content: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopyToastMessage('Copied');
      window.setTimeout(() => {
        setCopyToastMessage((prev) => (prev === 'Copied' ? null : prev));
      }, 1200);
    } catch {
      // Ignore clipboard failures in restricted environments.
    }
  };

  const handleSeatKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, seat: Seat) => {
    const key = event.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(key)) return;

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      handleSeatClick(seat);
      return;
    }

    event.preventDefault();
    const currentRowIdx = rows.indexOf(seat.row);
    let r = currentRowIdx;
    let c = seat.colIndex;

    if (key === 'ArrowRight') c += 1;
    else if (key === 'ArrowLeft') c -= 1;
    else if (key === 'ArrowDown') r += 1;
    else if (key === 'ArrowUp') r -= 1;

    const nextRow = rows[r];
    if (!nextRow) return;

    const nextSeat = seats.find((s) => s.row === nextRow && s.colIndex === c);
    if (!nextSeat) return;

    setFocusedSeatId(nextSeat.id);
    document.querySelector<HTMLButtonElement>(`button[data-seat-id="${nextSeat.id}"]`)?.focus();
  };

  return (
    <div
      className={`seating-root ${compactMode ? 'seating-root-compact' : ''} ${!hideTools && isToolsOpen ? 'seating-root-tools-open' : ''}`}
      onMouseUp={() => setIsDragSelecting(false)}
      onMouseLeave={() => setIsDragSelecting(false)}
    >
      <div className="seating-main-column">
      {isMobileViewport && isFitOverview && (
        <div className="seating-fit-banner" role="status" aria-live="polite">
          <span>Theater formatted to fit your screen.</span>
          <button
            type="button"
            className="seating-fit-primary-btn"
            onClick={() => setIsFitOverview(false)}
          >
            Select Seats
          </button>
        </div>
      )}
      <div
        ref={fitViewportRef}
        className={`seating-fit-viewport ${
          isMobileViewport && isFitOverview
            ? 'seating-fit-viewport-overview'
            : isMobileViewport
            ? 'seating-fit-viewport-scroll'
            : ''
        }`}
      >
      <div
        className={
          isMobileViewport && isFitOverview
            ? 'seating-fit-scale-clip'
            : 'seating-fit-viewport-inner'
        }
        style={
          isMobileViewport && isFitOverview && fitScaledBox
            ? {
                height: fitScaledBox.h,
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                boxSizing: 'border-box',
              }
            : undefined
        }
      >
      <div
        ref={fitContentRef}
        className="seating-fit-content"
        style={
          isMobileViewport && isFitOverview
            ? {
                transform: `scale(${fitScale})`,
                transformOrigin: 'top center',
                pointerEvents: 'none',
              }
            : undefined
        }
      >
      <div className="seating-stage-wrap">
        {!hideTools && !isToolsOpen && (
          <div className="seating-tools-row">
            <button
              className="seating-tools-btn seating-tools-btn-desktop"
              type="button"
              onClick={() => setIsToolsOpen(true)}
              aria-pressed={false}
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
        Seating chart keyboard controls: arrow keys move one seat at a time in all directions through the full house,
        including sold or held seats, so you can build a mental map of the theater. Press Enter or Space to select an
        available seat; sold or held seats cannot be purchased from this chart unless seating tools are open.
      </p>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {seatLiveMessage}
      </p>
      <div className="seating-grid" role="grid" aria-label="Interactive seating chart" aria-describedby="seating-grid-help">
        {rows.map((row, rowIndex) => {
          return (
            <div key={row} className="seating-row" role="row" aria-label={`Row ${row}`}>
              <div className="seating-row-label" role="rowheader">
                {row}
              </div>
              <div className="seating-row-seats" role="presentation">
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
                        type="button"
                        data-seat-id={seat.id}
                        onMouseDown={() => {
                          setIsDragSelecting(true);
                          handleSeatClick(seat, false);
                        }}
                        onMouseEnter={() => {
                          setSeatHoverTooltip(seat);
                          if (isDragSelecting) handleSeatClick(seat, true);
                        }}
                        onMouseMove={(event) => {
                          setTooltipPosition({ x: event.clientX, y: event.clientY });
                        }}
                        onMouseLeave={() => {
                          setSeatHoverTooltip(null);
                        }}
                        onFocus={(event) => {
                          setFocusedSeatId(seat.id);
                          setSeatHoverTooltip(seat);
                          const target = event.currentTarget;
                          runAfterNextPaint(() => {
                            const rect = target.getBoundingClientRect();
                            setTooltipPosition({
                              x: rect.left + rect.width / 2,
                              y: rect.bottom,
                            });
                          });
                        }}
                        onBlur={() => {
                          setSeatHoverTooltip(null);
                        }}
                        onKeyDown={(event) => handleSeatKeyDown(event, seat)}
                        onClick={(event) => {
                          // Keyboard-triggered click (Enter/Space) has detail=0.
                          if (event.detail === 0) handleSeatClick(seat);
                        }}
                        className={`seating-seat-btn ${seatColors[displayStatus]} ${isSuggested ? 'seating-seat-suggested' : ''} ${focusedSeatId === seat.id ? 'seating-seat-focused' : ''}`}
                        aria-label={getSeatAriaLabel(seat, displayStatus)}
                        role="gridcell"
                        aria-selected={displayStatus === 'selected'}
                        aria-disabled={isUnavailable && !isToolsOpen}
                        tabIndex={focusedSeatId === null || focusedSeatId === seat.id ? 0 : -1}
                        style={isUnavailable && !isToolsOpen ? { cursor: 'not-allowed' } : undefined}
                      >
                        {isAccessible && <Accessibility className="seating-accessible-icon" />}
                        {seat.status === 'available' && <span className="seating-seat-symbol">•</span>}
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
              <div className="seating-row-label" aria-hidden="true">
                {row}
              </div>
            </div>
          );
        })}
      </div>

      {seatHoverTooltip && (
        <div
          className="seating-tooltip"
          style={{ left: `${tooltipPosition.x + 12}px`, top: `${tooltipPosition.y + 12}px` }}
          aria-hidden="true"
        >
          <div>{getSeatLocationLabel(seatHoverTooltip)}</div>
          <div>${seatHoverTooltip.price}</div>
        </div>
      )}

      <div className="seating-legend">
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-available seating-legend-dot-indicated">
            <span className="seating-legend-dot-symbol">•</span>
          </div>
          <span className="seating-legend-label">Available (•)</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-vip seating-legend-dot-indicated">
            <span className="seating-legend-dot-symbol seating-legend-dot-symbol-vip">V</span>
          </div>
          <span className="seating-legend-label">VIP (V)</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-accessible seating-legend-dot-accessible">
            <Accessibility className="seating-legend-accessible-icon" />
          </div>
          <span className="seating-legend-label">Accessible</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-taken seating-legend-dot-indicated">
            <span className="seating-legend-dot-symbol">X</span>
          </div>
          <span className="seating-legend-label">Unavailable (X)</span>
        </div>
        <div className="seating-legend-item">
          <div className="seating-legend-dot seating-seat-selected"></div>
          <span className="seating-legend-label">Selected</span>
        </div>
      </div>

      {isMobileViewport && !isFitOverview && (
        <div className="seating-fit-actions">
          <button
            type="button"
            className="seating-fit-secondary-btn"
            onClick={handleViewEntireTheater}
          >
            View Entire Theater
          </button>
        </div>
      )}
      </div>
      </div>
      </div>

      {!hideTools && (
      <div className={`seating-tools-sidebar ${isToolsOpen ? 'seating-tools-sidebar-open' : 'seating-tools-sidebar-closed'}`}>
          <div className="seating-tools-header">
            <div className="seating-tools-title">Tools</div>
            <div className="seating-tools-actions">
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
          <section className="seating-tools-group" aria-label="Seating tools">
            <div className="seating-tools-group-title">Seating Tools</div>
            <div className="seating-tools-grid">
            <label className="seating-ticket-count-label">
              Rows
              <select
                value={rowCount}
                onChange={(event) => setRowCount(Number(event.target.value))}
                className="seating-ticket-count-select"
              >
                {ROW_COUNT_OPTIONS.map((count) => (
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
                {SEATS_PER_ROW_OPTIONS.map((count) => (
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
                <div id="seating-assign-hint" className="seating-tools-hint">
                  Select seats on the chart to assign a type.
                </div>
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
                aria-disabled={selectedSeats.length === 0}
                aria-describedby={selectedSeats.length === 0 ? 'seating-assign-hint' : undefined}
              >
                Apply
              </button>
              {applyHint && (
                <p className="seating-apply-hint-popover" role="status" aria-live="polite">
                  {applyHint}
                </p>
              )}
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
          </section>
          <section className="seating-tools-group" aria-label="Developer insights">
            <div className="seating-tools-group-title">Developer Insights</div>
            <div className="seating-tools-stack-list">
              <button
                className={`seating-reset-btn seating-tools-stack-btn ${isLogicOpen ? 'seating-tools-stack-btn-on' : ''}`}
                type="button"
                onClick={() => setIsLogicOpen((prev) => !prev)}
                aria-pressed={isLogicOpen}
              >
                <Code2 className="w-4 h-4" />
                View Logic
              </button>
              <button
                className={`seating-reset-btn seating-tools-stack-btn ${isArchitectureOpen ? 'seating-tools-stack-btn-on' : ''}`}
                type="button"
                onClick={() => setIsArchitectureOpen((prev) => !prev)}
                aria-pressed={isArchitectureOpen}
              >
                <Network className="w-4 h-4" />
                Planned System Architecture
              </button>
              <button
                className={`seating-reset-btn seating-tools-stack-btn ${isDebugMode ? 'seating-tools-stack-btn-on' : ''}`}
                type="button"
                onClick={() => setIsDebugMode((prev) => !prev)}
                aria-pressed={isDebugMode}
              >
                <Bug className="w-4 h-4" />
                Debug
              </button>
            </div>
          </section>

      </div>
      )}

      {!hideQuickControls && (
      <div className="seating-controls">
        {!hideTools && !isToolsOpen && (
          <button
            className="seating-tools-btn seating-tools-btn-mobile"
            type="button"
            onClick={() => setIsToolsOpen(true)}
            aria-pressed={false}
          >
            <Settings2 className="w-4 h-4" />
            Tools
          </button>
        )}
        <label className="seating-ticket-count-label">
          Tickets
          <select
            value={ticketCount}
            onChange={(event) => updateTicketCount(Number(event.target.value))}
            className="seating-ticket-count-select"
          >
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
        <button
          className={`seating-suggest-btn ${isSuggesting ? 'seating-suggest-btn-loading' : ''}`}
          type="button"
          onClick={handleSuggestBest}
          disabled={isSuggesting}
        >
          {isSuggesting ? 'Calculating...' : 'Suggest Best Seats'}
        </button>
        <button className="seating-reset-btn" type="button" onClick={resetAssignments}>
          Reset
        </button>
      </div>
      )}

      {!hideSummary && selectedSeats.length > 0 && (
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

      {isArchitectureOpen && (
        <div
          className="seating-architecture-modal-wrap"
          role="presentation"
          onClick={() => setIsArchitectureOpen(false)}
        >
          <div className="seating-architecture-modal-backdrop" onClick={() => setIsArchitectureOpen(false)} />
          <section
            className="seating-architecture-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Planned system architecture"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="seating-architecture-modal-header">
              <div className="seating-architecture-title">Planned System Architecture</div>
              <button
                type="button"
                className="seating-tools-close"
                onClick={() => setIsArchitectureOpen(false)}
                aria-label="Close architecture diagram"
                title="Close architecture diagram"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="seating-architecture-divider" />
            <div className="seating-architecture-diagram-wrap">
              <div className="seating-architecture-legend seating-architecture-legend-overlay" aria-hidden="true">
                <span className="seating-architecture-chip seating-architecture-chip-ui">UI</span>
                <span className="seating-architecture-chip seating-architecture-chip-store">Store</span>
                <span className="seating-architecture-chip seating-architecture-chip-api">API</span>
                <span className="seating-architecture-chip seating-architecture-chip-process">Process</span>
              </div>
              <img
                className="seating-architecture-image"
                src="/architecture-diagram.svg"
                alt="System architecture showing UI flows to booking store, process step, and reservation API"
              />
            </div>
            <p className="seating-architecture-explainer">
              The Global Usher and booking interfaces publish intent into a centralized Booking Store, which coordinates
              seat inventory, pricing totals, and route state. Seat actions run through an optimistic hold/release
              process so the UI responds instantly, then commit against the Reservation API for final server-side
              validation and conflict resolution.
            </p>
          </section>
        </div>
      )}

      {isLogicOpen && (
        <div className="seating-architecture-modal-wrap" role="presentation" onClick={() => setIsLogicOpen(false)}>
          <div className="seating-architecture-modal-backdrop" onClick={() => setIsLogicOpen(false)} />
          <section
            className="seating-architecture-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Seat grid logic snippet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="seating-architecture-modal-header">
              <div className="seating-architecture-title">Seat Grid Logic</div>
              <div className="seating-modal-header-actions">
                <button
                  type="button"
                  className="seating-modal-copy-btn"
                  onClick={() => handleCopyPanel(logicCodePlain)}
                  aria-label="Copy logic snippet"
                  title="Copy logic snippet"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="seating-tools-close"
                  onClick={() => setIsLogicOpen(false)}
                  aria-label="Close logic snippet"
                  title="Close logic snippet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="seating-architecture-divider" />
            <pre className="seating-logic-panel">
              <code className="seating-code">
                <span className="seating-code-line"><span className="seating-code-keyword">const</span> previous = selectedSeatIds;</span>
                <span className="seating-code-line"><span className="seating-code-fn">setSelectedSeatIds</span>(nextSeatIds); <span className="seating-code-comment">// optimistic</span></span>
                <span className="seating-code-line"><span className="seating-code-keyword">const</span> holdId = crypto.<span className="seating-code-fn">randomUUID</span>();</span>
                <span className="seating-code-line"><span className="seating-code-keyword">try</span> {'{'}</span>
                <span className="seating-code-line">  <span className="seating-code-keyword">await</span> reservationApi.<span className="seating-code-fn">holdSeats</span>({'{'} holdId, seatIds: nextSeatIds {'}'});</span>
                <span className="seating-code-line">  bookingStore.<span className="seating-code-fn">commitHold</span>({'{'} holdId, seatIds: nextSeatIds {'}'});</span>
                <span className="seating-code-line">{'}'} <span className="seating-code-keyword">catch</span> (error) {'{'}</span>
                <span className="seating-code-line">  <span className="seating-code-fn">setSelectedSeatIds</span>(previous); <span className="seating-code-comment">// rollback</span></span>
                <span className="seating-code-line">  bookingStore.<span className="seating-code-fn">markConflict</span>(nextSeatIds, error);</span>
                <span className="seating-code-line">{'}'}</span>
              </code>
            </pre>
            <p className="seating-logic-explainer">
              This flow updates the UI instantly when seats are selected, then attempts a server hold. If the API confirms, the hold is committed to shared booking state; if it fails (for example, seats were just claimed elsewhere), the UI rolls back to the previous selection and marks a conflict for recovery messaging.
            </p>
          </section>
        </div>
      )}

      {isDebugMode && (
        <div className="seating-architecture-modal-wrap" role="presentation" onClick={() => setIsDebugMode(false)}>
          <div className="seating-architecture-modal-backdrop" onClick={() => setIsDebugMode(false)} />
          <section
            className="seating-architecture-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Debug snapshot"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="seating-architecture-modal-header">
              <div className="seating-architecture-title">Debug Snapshot</div>
              <div className="seating-modal-header-actions">
                <button
                  type="button"
                  className="seating-modal-copy-btn"
                  onClick={() => handleCopyPanel(debugSnapshot)}
                  aria-label="Copy debug snapshot"
                  title="Copy debug snapshot"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="seating-tools-close"
                  onClick={() => setIsDebugMode(false)}
                  aria-label="Close debug snapshot"
                  title="Close debug snapshot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="seating-architecture-divider" />
            <pre className="seating-debug-panel">{debugSnapshot}</pre>
          </section>
        </div>
      )}
      </div>
      {copyToastMessage && (
        <div className="seating-copy-toast" role="status" aria-live="polite">
          {copyToastMessage}
        </div>
      )}
    </div>
  );
}
