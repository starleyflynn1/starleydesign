import type { LineResultEntry, LineResultReason, ParsedScript } from '../types/script';
import { characterMatches } from './scriptParser';
import { formatAlignmentPlain } from './wordAlignment';

function countUserLines(script: ParsedScript, userCharacters: string[]): number {
  if (userCharacters.length === 0) return 0;
  return script.lines.filter((line) =>
    userCharacters.some((name) => characterMatches(name, line.character))
  ).length;
}

function reasonLabel(reason: LineResultReason): string {
  if (reason === 'correct') return 'word-perfect';
  if (reason === 'skipped') return 'skipped (said "next")';
  if (reason === 'prompted') return 'prompted (said "line")';
  return 'word errors';
}

function sortResults(results: LineResultEntry[]): LineResultEntry[] {
  return [...results].sort((a, b) => a.lineIndex - b.lineIndex);
}

export function splitLineResults(results: LineResultEntry[]) {
  const sorted = sortResults(results);
  return {
    correct: sorted.filter((entry) => entry.reason === 'correct'),
    needsReview: sorted.filter((entry) => entry.reason !== 'correct'),
  };
}

export function formatRehearsalReport(
  script: ParsedScript,
  userCharacters: string[],
  lineResults: LineResultEntry[]
): string {
  const title = script.title?.trim() || 'Untitled scene';
  const characters =
    userCharacters.length > 0 ? userCharacters.join(', ') : 'Read-through';
  const totalUserLines = countUserLines(script, userCharacters);
  const { correct, needsReview } = splitLineResults(lineResults);
  const date = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const lines: string[] = [
    'Line Prompter — Rehearsal Report',
    '',
    `Scene: ${title}`,
    `Your character(s): ${characters}`,
    `Date: ${date}`,
    '',
  ];

  if (userCharacters.length === 0) {
    lines.push(
      'No character selected — pick your role to track and email word-by-word results.'
    );
    return lines.join('\n');
  }

  lines.push(
    `Summary: ${correct.length} word-perfect, ${needsReview.length} to review (${lineResults.length} of ${totalUserLines} your lines rehearsed)`,
    ''
  );

  if (correct.length > 0) {
    lines.push(`Word-perfect (${correct.length}):`, '');
    correct.forEach((entry, index) => {
      lines.push(
        `${index + 1}. Line ${entry.lineIndex + 1} — ${entry.character.toUpperCase()}`,
        `"${entry.text}"`
      );
      if (entry.spokenAttempt?.trim()) {
        lines.push(`   Heard: "${entry.spokenAttempt.trim()}"`);
      }
      lines.push('');
    });
  }

  if (needsReview.length > 0) {
    lines.push(`To review (${needsReview.length}):`, '');
    needsReview.forEach((entry, index) => {
      lines.push(
        `${index + 1}. Line ${entry.lineIndex + 1} — ${entry.character.toUpperCase()} (${reasonLabel(entry.reason)})`,
        formatAlignmentPlain(entry.wordAlignment)
      );
      if (entry.spokenAttempt?.trim()) {
        lines.push(`   Heard: "${entry.spokenAttempt.trim()}"`);
      }
      lines.push('');
    });
  }

  if (lineResults.length === 0) {
    lines.push('No lines were rehearsed in this session.');
  } else if (needsReview.length === 0) {
    lines.push('Every rehearsed line was word-perfect.');
  }

  return lines.join('\n').trimEnd();
}

export function buildRehearsalMailto(
  script: ParsedScript,
  userCharacters: string[],
  lineResults: LineResultEntry[]
): string {
  const title = script.title?.trim() || 'Untitled scene';
  const subject = `Line Prompter report — ${title}`;
  let body = formatRehearsalReport(script, userCharacters, lineResults);

  const maxBodyLength = 1800;
  if (body.length > maxBodyLength) {
    body = `${body.slice(0, maxBodyLength)}\n\n[Report truncated for email length limits]`;
  }

  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** @deprecated Use formatRehearsalReport */
export const formatMissedLinesReport = formatRehearsalReport;

/** @deprecated Use buildRehearsalMailto */
export const buildMissedLinesMailto = buildRehearsalMailto;
