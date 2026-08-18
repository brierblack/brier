import { memo, type CSSProperties } from 'react';

export interface WordmarkProps {
  className?: string;
  style?: CSSProperties;
}

export const Wordmark = memo(({ className, style }: WordmarkProps) =>{
  return (
    <span
      className={className}
      style={{
        fontWeight: 700,
        letterSpacing: '-0.5px',
        background:
          'linear-gradient(135deg, #ffb060 0%, #fe6e00 25%, #ff5e7a 50%, #c44ad8 75%, #6f5cf0 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        ...style,
      }}
    >
      Hive
    </span>
  );
})
