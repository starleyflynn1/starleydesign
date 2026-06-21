import type { AlignedWord, WordMatchStatus } from '../types/script';
import { tokenize } from './lineMatcher';

export type { AlignedWord, WordMatchStatus };

export function splitDisplayWords(text: string): string[] {
  return text.match(/\S+/g) ?? [];
}

function wordsEquivalent(a: string, b: string): boolean {
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^\w']/g, '').replace(/'/g, '');
  return normalize(a) === normalize(b);
}

function stripCommandTokens(tokens: string[]): string[] {
  return tokens.filter(
    (token) => token !== 'line' && token !== 'next' && token !== 'back'
  );
}

export interface WordAlignmentOptions {
  /** Treat unspoken words as missing (skip/prompt/end) vs still pending (live) */
  lineEnded?: boolean;
}

export function computeWordAlignment(
  expectedText: string,
  transcript: string,
  options: WordAlignmentOptions = {}
): AlignedWord[] {
  if (options.lineEnded) {
    return computeFinalWordAlignment(expectedText, transcript);
  }
  return computeLiveWordAlignment(expectedText, transcript);
}

/** Live prompter: only mark words correct or pending — never wrong ahead of the actor. */
function computeLiveWordAlignment(
  expectedText: string,
  transcript: string
): AlignedWord[] {
  const display = splitDisplayWords(expectedText);
  const expected = tokenize(expectedText);
  const spoken = stripCommandTokens(tokenize(transcript));

  const result: AlignedWord[] = [];
  let spokenIdx = 0;
  let expectedIdx = 0;

  while (expectedIdx < expected.length) {
    const displayWord = display[expectedIdx] ?? expected[expectedIdx];
    const target = expected[expectedIdx];

    if (spokenIdx >= spoken.length) {
      result.push({ word: displayWord, status: 'pending' });
      expectedIdx++;
      continue;
    }

    if (wordsEquivalent(spoken[spokenIdx], target)) {
      result.push({ word: displayWord, status: 'correct' });
      spokenIdx++;
      expectedIdx++;
      continue;
    }

    const junkSkipped = skipLeadingSpokenJunk(spoken, spokenIdx, target);
    if (junkSkipped > spokenIdx) {
      spokenIdx = junkSkipped;
      continue;
    }

    // Actor is still on this word — don't mark it or anything after as wrong yet.
    result.push({ word: displayWord, status: 'pending' });
    expectedIdx++;
    while (expectedIdx < expected.length) {
      result.push({
        word: display[expectedIdx] ?? expected[expectedIdx],
        status: 'pending',
      });
      expectedIdx++;
    }
    break;
  }

  return markCurrentWord(result);
}

function skipLeadingSpokenJunk(
  spoken: string[],
  spokenIdx: number,
  target: string
): number {
  for (let k = spokenIdx + 1; k < Math.min(spoken.length, spokenIdx + 3); k++) {
    if (wordsEquivalent(spoken[k], target)) {
      return k;
    }
  }
  return spokenIdx;
}

/** End-of-line / report: full alignment with wrong and missing words. */
function computeFinalWordAlignment(
  expectedText: string,
  transcript: string
): AlignedWord[] {
  const display = splitDisplayWords(expectedText);
  const expected = tokenize(expectedText);
  const spoken = stripCommandTokens(tokenize(transcript));

  const result: AlignedWord[] = [];
  let spokenIdx = 0;
  let expectedIdx = 0;

  while (expectedIdx < expected.length) {
    const displayWord = display[expectedIdx] ?? expected[expectedIdx];
    const target = expected[expectedIdx];

    if (spokenIdx >= spoken.length) {
      result.push({ word: displayWord, status: 'missing' });
      expectedIdx++;
      continue;
    }

    const current = spoken[spokenIdx];

    if (wordsEquivalent(current, target)) {
      result.push({ word: displayWord, status: 'correct' });
      spokenIdx++;
      expectedIdx++;
      continue;
    }

    let expectedAhead = -1;
    for (let k = expectedIdx + 1; k < Math.min(expected.length, expectedIdx + 4); k++) {
      if (wordsEquivalent(current, expected[k])) {
        expectedAhead = k;
        break;
      }
    }

    if (expectedAhead > expectedIdx) {
      for (let k = expectedIdx; k < expectedAhead; k++) {
        result.push({
          word: display[k] ?? expected[k],
          status: 'missing',
        });
      }
      result.push({
        word: display[expectedAhead] ?? expected[expectedAhead],
        status: 'correct',
      });
      spokenIdx++;
      expectedIdx = expectedAhead + 1;
      continue;
    }

    let spokenAhead = -1;
    for (let k = spokenIdx + 1; k < Math.min(spoken.length, spokenIdx + 4); k++) {
      if (wordsEquivalent(spoken[k], target)) {
        spokenAhead = k;
        break;
      }
    }

    if (spokenAhead > spokenIdx) {
      result.push({
        word: displayWord,
        status: 'wrong',
        spoken: current,
      });
      spokenIdx++;
      continue;
    }

    result.push({
      word: displayWord,
      status: 'wrong',
      spoken: current,
    });
    spokenIdx++;
    expectedIdx++;
  }

  return result;
}

function markCurrentWord(alignment: AlignedWord[]): AlignedWord[] {
  const currentIndex = alignment.findIndex((word) => word.status === 'pending');
  if (currentIndex < 0) return alignment;

  return alignment.map((word, index) => ({
    ...word,
    isCurrent: index === currentIndex,
  }));
}

export function hasWordIssues(alignment: AlignedWord[]): boolean {
  return alignment.some(
    (word) => word.status === 'wrong' || word.status === 'missing'
  );
}

export function formatAlignmentPlain(alignment: AlignedWord[]): string {
  return alignment
    .map((word) => {
      if (word.status === 'correct') return word.word;
      if (word.status === 'wrong') {
        return word.spoken
          ? `${word.word} [heard: ${word.spoken}]`
          : `${word.word} [wrong]`;
      }
      if (word.status === 'missing') return `${word.word} [missed]`;
      return word.word;
    })
    .join(' ');
}
