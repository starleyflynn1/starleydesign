import { useMemo, useState } from 'react';
import {
  buildRehearsalMailto,
  formatRehearsalReport,
  splitLineResults,
} from '../lib/rehearsalReport';
import type { LineResultEntry, ParsedScript } from '../types/script';
import { WordTrackedLine } from './WordTrackedLine';

interface RehearsalReportProps {
  script: ParsedScript;
  userCharacters: string[];
  lineResults: LineResultEntry[];
}

function reasonLabel(reason: LineResultEntry['reason']): string {
  if (reason === 'correct') return 'Word-perfect';
  if (reason === 'skipped') return 'Skipped';
  if (reason === 'prompted') return 'Prompted';
  return 'Word errors';
}

function ResultList({
  entries,
  variant,
}: {
  entries: LineResultEntry[];
  variant: 'correct' | 'review';
}) {
  if (entries.length === 0) return null;

  return (
    <ol className="missed-lines-list">
      {entries.map((entry) => (
        <li
          key={entry.lineIndex}
          className={`missed-lines-item${variant === 'correct' ? ' missed-lines-item--correct' : ''}`}
        >
          <div className="missed-lines-item-meta">
            <span className="missed-lines-item-line">
              Line {entry.lineIndex + 1}
            </span>
            <span className="missed-lines-item-character">{entry.character}</span>
            <span
              className={`missed-lines-item-reason missed-lines-item-reason--${entry.reason}`}
            >
              {reasonLabel(entry.reason)}
            </span>
          </div>
          {entry.reason === 'correct' ? (
            <p className="missed-lines-item-text">&ldquo;{entry.text}&rdquo;</p>
          ) : (
            <WordTrackedLine
              text={entry.text}
              alignment={entry.wordAlignment}
              className="missed-lines-item-tracked"
            />
          )}
          {entry.spokenAttempt?.trim() ? (
            <p className="missed-lines-item-attempt">
              Heard: &ldquo;{entry.spokenAttempt.trim()}&rdquo;
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function RehearsalReport({
  script,
  userCharacters,
  lineResults,
}: RehearsalReportProps) {
  const [copied, setCopied] = useState(false);
  const readThrough = userCharacters.length === 0;
  const { correct, needsReview } = useMemo(
    () => splitLineResults(lineResults),
    [lineResults]
  );

  const reportText = useMemo(
    () => formatRehearsalReport(script, userCharacters, lineResults),
    [script, userCharacters, lineResults]
  );

  const mailtoHref = useMemo(
    () => buildRehearsalMailto(script, userCharacters, lineResults),
    [script, userCharacters, lineResults]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      className="missed-lines-report rehearsal-report"
      aria-labelledby="rehearsal-report-heading"
    >
      <h2 id="rehearsal-report-heading" className="missed-lines-heading">
        Rehearsal report
      </h2>

      {readThrough ? (
        <p className="missed-lines-summary">
          Read-through finished. Pick your character before the next rehearsal
          to track and email word-by-word results.
        </p>
      ) : (
        <>
          <p className="missed-lines-summary">
            <strong>{correct.length}</strong> word-perfect
            {needsReview.length > 0 ? (
              <>
                {' '}
                · <strong>{needsReview.length}</strong> to review
              </>
            ) : null}
            {lineResults.length > 0 ? (
              <> · {lineResults.length} line{lineResults.length === 1 ? '' : 's'} rehearsed</>
            ) : (
              <> · no lines recorded yet</>
            )}
          </p>

          <div className="missed-lines-actions missed-lines-actions--primary">
            <a className="btn btn-primary" href={mailtoHref}>
              Email report
            </a>
            <button type="button" className="btn btn-secondary" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy report'}
            </button>
          </div>

          {lineResults.length === 0 ? (
            <p className="missed-lines-summary">
              Run through your lines to build a report you can email to yourself or
              your director.
            </p>
          ) : null}

          {needsReview.length > 0 ? (
            <>
              <h3 className="rehearsal-report-section-heading">Lines to review</h3>
              <ResultList entries={needsReview} variant="review" />
            </>
          ) : lineResults.length > 0 ? (
            <p className="missed-lines-summary missed-lines-summary--success">
              Every rehearsed line was word-perfect.
            </p>
          ) : null}

          {correct.length > 0 ? (
            <>
              <h3 className="rehearsal-report-section-heading">Word-perfect lines</h3>
              <ResultList entries={correct} variant="correct" />
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

/** @deprecated Use RehearsalReport */
export const MissedLinesReport = RehearsalReport;
