import { memo, useId, type CSSProperties } from 'react';

export interface LogoProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Brier mark: a butterfly whose wings are two mirrored letter "B"s,
 * its body a thorn seed (burr) radiating light outward.
 * Flat design; single flowing gradient sweeps the whole mark
 * (amber -> brand orange -> rose -> iris, top-left to bottom-right).
 */
const WING_PATH = 'M0 0V31M0 1.2H5A6.3 6.3 0 0 1 5 13.8H0M0 15.2H5.6A7.9 7.9 0 0 1 5.6 31H0';
const THORNS_PATH =
  'M51.9 56.1L60 57.2L52.4 54.1ZM50.8 58.3L56.4 62.4L52.3 56.8ZM48.6 60.4L51.7 67.9L50.7 59.8ZM45.3 59.8L44.6 66.7L47.4 60.4ZM43.7 56.8L38.7 63.3L45.2 58.3ZM43.6 54.1L37.3 56.9L44.1 56.1ZM44.1 51.9L36 50.8L43.6 53.9ZM45.2 49.7L39.6 45.6L43.7 51.2ZM47.4 47.6L44.3 40.1L45.3 48.2ZM50.7 48.2L51.4 41.3L48.6 47.6ZM52.3 51.2L57.3 44.7L50.8 49.7ZM52.4 53.9L58.7 51.1L51.9 51.9Z';
const SEED_PATH =
  'M48 46.2C52.5 46.6 54.6 49.8 54.3 53.6C54 58.2 51.2 63.5 48 67.8C44.8 63.5 42 58.2 41.7 53.6C41.4 49.8 43.5 46.6 48 46.2Z';

export const Logo = memo(({ className, style }: LogoProps) => {
  const gradientId = useId();

  return (
    <svg
      viewBox="20.5 15.1 55 55"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="20"
          y1="18"
          x2="76"
          y2="68"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ffc53d" />
          <stop offset="30%" stopColor="#fe6e00" />
          <stop offset="62%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#8d54ff" />
        </linearGradient>
      </defs>
      <g
        stroke={`url(#${gradientId})`}
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d={WING_PATH} transform="translate(62.6 20.2) rotate(24)" />
        <path
          d={WING_PATH}
          transform="translate(96 0) scale(-1 1) translate(62.6 20.2) rotate(24)"
        />
      </g>
      <g fill={`url(#${gradientId})`}>
        <path d={THORNS_PATH} />
        <path d={SEED_PATH} />
      </g>
      <circle cx="48" cy="52.5" r="2.2" fill="#fff" />
    </svg>
  );
});
