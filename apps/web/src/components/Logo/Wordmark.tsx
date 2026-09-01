import { memo, type CSSProperties } from 'react';

export interface WordmarkProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * "Brier Black" wordmark: monochrome "brier" plus a black circular
 * "B" badge (the "Black") resting at the top-right of the word,
 * matching the black & white leaf logo.
 */
export const Wordmark = memo(({ className, style }: WordmarkProps) => {
  return (
    <span className={`font-bold tracking-tight ${className ?? ''}`} style={style}>
      <span className="text-ink">Brier</span>
    </span>
  );
});
