import { useMemo } from 'react';
import type { AlignedWord } from '../lib/wordAlignment';
import {
  computeWordAlignment,
  type WordAlignmentOptions,
} from '../lib/wordAlignment';

interface WordTrackedLineProps {
  text: string;
  transcript?: string;
  alignment?: AlignedWord[];
  alignmentOptions?: WordAlignmentOptions;
  className?: string;
}

function wordTitle(word: AlignedWord): string | undefined {
  if (word.status === 'wrong' && word.spoken) {
    return `Heard "${word.spoken}" instead`;
  }
  if (word.status === 'missing') return 'Not spoken';
  if (word.isCurrent) return 'Say this word next';
  return undefined;
}

export function WordTrackedLine({
  text,
  transcript = '',
  alignment: alignmentProp,
  alignmentOptions,
  className = 'line-text',
}: WordTrackedLineProps) {
  const alignment = useMemo(() => {
    if (alignmentProp) return alignmentProp;
    return computeWordAlignment(text, transcript, alignmentOptions);
  }, [alignmentProp, text, transcript, alignmentOptions]);

  return (
    <p className={`${className} line-text--tracked`}>
      {alignment.map((word, index) => (
        <span
          key={`${index}-${word.word}`}
          className={[
            'line-word',
            `line-word--${word.status}`,
            word.isCurrent ? 'line-word--current' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          title={wordTitle(word)}
        >
          {word.word}
          {index < alignment.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}
