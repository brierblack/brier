import { memo, useId, type CSSProperties } from 'react';

export interface LogoProps {
  className?: string;
  style?: CSSProperties;
}

export const Logo = memo(({ className, style }: LogoProps) =>{
  const gradientId = useId();

  return (
    <svg viewBox="16 26 68 42" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffb060" />
          <stop offset="20%" stopColor="#fe6e00" />
          <stop offset="50%" stopColor="#ff5e7a" />
          <stop offset="78%" stopColor="#c44ad8" />
          <stop offset="100%" stopColor="#6f5cf0" />
        </linearGradient>
      </defs>
      <path
        d="M50 32 L63 39.5 L63 54.5 L50 62 L37 54.5 L37 39.5 Z"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.7"
        strokeLinejoin="round"
      />
      <path
        d="M37 39.5 Q24 37 22 47 Q24 55 33 52"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M63 39.5 Q76 37 78 47 Q76 55 67 52"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="50" cy="47" r="1.7" fill={`url(#${gradientId})`} />
    </svg>
  );
})
