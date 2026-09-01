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
    <span
      className={className}
      style={{
        fontWeight: 700,
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      <span style={{ color: '#0f172b' }}>Brier</span>
    </span>
  );
});
