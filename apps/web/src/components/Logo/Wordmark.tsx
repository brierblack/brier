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
        brier
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: '0.5em',
          width: '1em',
          height: '1em',
          fontSize: '0.52em',
          borderRadius: '9999px',
          background: '#0f172b',
          color: '#fff',
          transform: 'translate(0.25em, -0.25em)',
        }}
      >
        <span
          style={{
            fontSize: '0.62em',
            fontWeight: 700,
            lineHeight: 1,
            transform: 'translateY(0.01em)',
          }}
        >
          B
        </span>
      </span>
    </span>
  );
});
