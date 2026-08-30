import { memo, type CSSProperties } from 'react';

export interface WordmarkProps {
  className?: string;
  style?: CSSProperties;
}

const TEXT_GRADIENT = 'linear-gradient(135deg, #ffc53d 0%, #fe6e00 30%, #f43f5e 62%, #8d54ff 100%)';

/**
 * "Brier Black" wordmark: gradient "brier" plus a black circular
 * "B" badge (the "Black") resting at the top-right of the word.
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
      <span
        style={{
          background: TEXT_GRADIENT,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        }}
      >
        Brier
      </span>
    </span>
  );
});
