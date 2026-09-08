import { memo } from 'react';

export const Sparkline = memo(({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1);
  const barWidth = 4;
  const gap = 2;
  const height = 28;
  return (
    <svg width={data.length * (barWidth + gap)} height={height} className="block">
      {data.map((v, i) => {
        const barHeight = v === 0 ? 2 : (v / max) * (height - 2);
        return (
          <rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={1}
            fill={v > 0 ? '#1677ff' : '#d9d9d9'}
          />
        );
      })}
    </svg>
  );
});
