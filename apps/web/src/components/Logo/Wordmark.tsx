import { memo, type CSSProperties } from 'react';

export interface WordmarkProps {
  className?: string;
  style?: CSSProperties;
}

export const Wordmark = memo(({ className, style }: WordmarkProps) => {
  return (
    <span
      className={className}
      style={{
        fontWeight: 700,
        letterSpacing: '-0.5px',
        ...style,
      }}
    >
      <span
        style={{
          background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 33%, #a855f7 66%, #ec4899 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        }}
      >
        brier
      </span>
      <span style={{ color: '#9ca3af' }}> black</span>
    </span>
  );
});
