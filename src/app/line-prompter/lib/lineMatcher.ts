const PROMPT_KEYWORD = 'line';
const SKIP_KEYWORD = 'next';
const BACK_KEYWORD = 'back';

/** Normalize text for comparison: lowercase, no punctuation, collapsed whitespace */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  const normalized = normalizeForMatch(text);
  return normalized ? normalized.split(' ') : [];
}

/** Whole-word "line" prompt trigger (not inside another word) */
export function containsLinePromptKeyword(transcript: string): boolean {
  return /\bline\b/i.test(transcript.trim());
}

/** Whole-word "next" skip trigger (not inside another word) */
export function containsNextLineKeyword(transcript: string): boolean {
  return /\bnext\b/i.test(transcript.trim());
}

/** Whole-word "back" retreat trigger (not inside another word) */
export function containsBackLineKeyword(transcript: string): boolean {
  return /\bback\b/i.test(transcript.trim());
}

/**
 * Share of expected line words heard in the transcript (0–1).
 */
export function wordRecallScore(transcript: string, expected: string): number {
  const spoken = tokenize(transcript);
  const target = tokenize(expected);
  if (target.length === 0) return spoken.length === 0 ? 1 : 0;
  if (spoken.length === 0) return 0;

  const spokenSet = new Set(spoken);
  let matches = 0;
  for (const word of target) {
    if (spokenSet.has(word)) matches++;
  }
  return matches / target.length;
}

/**
 * Word-overlap ratio between transcript and expected line.
 * Returns 0–1.
 */
export function wordOverlapScore(transcript: string, expected: string): number {
  const spoken = tokenize(transcript);
  const target = tokenize(expected);
  if (target.length === 0) return spoken.length === 0 ? 1 : 0;
  if (spoken.length === 0) return 0;

  const targetSet = new Set(target);
  let matches = 0;
  for (const word of spoken) {
    if (targetSet.has(word)) matches++;
  }

  const recall = matches / target.length;
  const precision = matches / spoken.length;
  return recall * 0.7 + precision * 0.3;
}

export interface LineMatchOptions {
  /** User paused — prioritize recall so finishing the line can advance. */
  utteranceComplete?: boolean;
}

/**
 * True when the user has said their line closely enough to advance.
 */
export function isLineMatch(
  transcript: string,
  expected: string,
  sensitivity: number,
  options: LineMatchOptions = {}
): boolean {
  if (containsLinePromptKeyword(transcript)) return false;
  if (containsNextLineKeyword(transcript)) return false;
  if (containsBackLineKeyword(transcript)) return false;

  const spoken = normalizeForMatch(transcript);
  const target = normalizeForMatch(expected);
  if (!target) return true;
  if (!spoken) return false;

  const threshold = Math.max(0.45, Math.min(0.95, sensitivity));

  if (spoken === target) return true;
  if (spoken.includes(target) || target.includes(spoken)) {
    const shorter = Math.min(spoken.length, target.length);
    const longer = Math.max(spoken.length, target.length);
    if (shorter / longer >= 0.5) return true;
  }

  const recall = wordRecallScore(transcript, expected);
  if (options.utteranceComplete && recall >= threshold) return true;

  const overlap = wordOverlapScore(transcript, expected);
  if (overlap >= threshold) return true;

  // Short lines: a pause after saying most of the line is enough to advance.
  if (options.utteranceComplete && target.split(' ').length <= 6) {
    return recall >= Math.max(0.55, threshold - 0.15);
  }

  return false;
}

export { BACK_KEYWORD, PROMPT_KEYWORD, SKIP_KEYWORD };
