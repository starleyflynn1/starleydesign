import { useEffect, useRef } from 'react';
import { characterMatches } from '../lib/scriptParser';
import type { ScriptLine } from '../types/script';

interface ScriptPreviewProps {
  lines: ScriptLine[];
  characters: string[];
  userCharacters: string[];
  currentLineIndex: number;
  onJumpToLine: (lineIndex: number) => void;
}

export function ScriptPreview({
  lines,
  characters,
  userCharacters,
  currentLineIndex,
  onJumpToLine,
}: ScriptPreviewProps) {
  const activeLineRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentLineIndex]);

  return (
    <details className="preview-details" open>
      <summary>
        Script preview ({lines.length} lines, {characters.length} characters)
      </summary>
      <p className="preview-hint">
        Click any line to set your starting point, then press Start Rehearsal.
      </p>
      <ol className="preview-list preview-scroll" aria-label="Full script">
        {lines.map((line) => {
          const isCurrent = line.index === currentLineIndex;
          const isUserLine = userCharacters.some((name) =>
            characterMatches(name, line.character)
          );

          return (
            <li
              key={line.index}
              ref={isCurrent ? activeLineRef : undefined}
              className={isCurrent ? 'preview-line-item preview-line-current' : 'preview-line-item'}
            >
              <button
                type="button"
                className={`preview-line${isUserLine ? ' preview-line-user' : ''}`}
                onClick={() => onJumpToLine(line.index)}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <strong>{line.character}:</strong> {line.text}
              </button>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
