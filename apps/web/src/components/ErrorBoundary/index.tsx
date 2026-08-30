import { Component, useEffect, useReducer, useRef, type ErrorInfo, type ReactNode } from 'react';
import { ExclamationCircleFilled, ReloadOutlined } from '@ant-design/icons';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** 错误上报回调（打点/日志） */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** 全局错误边界：渲染异常时展示恐龙跳跃小游戏 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <CrashScreen error={error} onRetry={this.reset} />;
  }
}

/* ----------------------------- 游戏常量 ----------------------------- */
const GAME_W = 800;
const GAME_H = 200;
const GROUND_Y = 168;
const DINO_X = 92;
const DINO_W = 40;
const DINO_H = 40;
const GRAVITY = 0.6;
const JUMP = -11;
const CACTUS_VB = 22;
const CACTUS_VH = 36;
const BASE_SPEED = 5;

interface Obstacle {
  x: number;
  h: number;
}
interface GameState {
  phase: 'idle' | 'running' | 'over';
  score: number;
  best: number;
  dinoY: number;
  velocity: number;
  obstacles: Obstacle[];
  speed: number;
  nextSpawn: number;
  clouds: { x: number; y: number; s: number; v: number }[];
  hillScroll: number;
  frame: number;
  scroll: number;
}

const initialState = (best: number): GameState => ({
  phase: 'idle',
  score: 0,
  best,
  dinoY: 0,
  velocity: 0,
  obstacles: [],
  speed: BASE_SPEED,
  nextSpawn: 300,
  clouds: [
    { x: 600, y: 28, s: 1, v: 0.22 },
    { x: 340, y: 12, s: 0.7, v: 0.16 },
    { x: 150, y: 42, s: 0.85, v: 0.19 },
  ],
  hillScroll: 0,
  frame: 0,
  scroll: 0,
});

const aabb = (
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

const step = (s: GameState) => {
  if (s.phase !== 'running') return;

  s.score += 0.15;
  s.frame += 1;
  s.scroll += s.speed;
  s.hillScroll += s.speed * 0.35;
  s.speed = BASE_SPEED + Math.min(5, s.score / 60);

  s.velocity += GRAVITY;
  s.dinoY += s.velocity;
  if (s.dinoY >= 0) {
    s.dinoY = 0;
    s.velocity = 0;
  }

  for (const o of s.obstacles) o.x -= s.speed;
  s.obstacles = s.obstacles.filter((o) => o.x > -40);

  s.nextSpawn -= s.speed;
  if (s.nextSpawn <= 0) {
    s.obstacles.push({ x: GAME_W + 20, h: 28 + Math.random() * 16 });
    s.nextSpawn = 220 + Math.random() * 200;
  }

  for (const c of s.clouds) {
    c.x -= s.speed * c.v;
    if (c.x < -70) c.x = GAME_W + 60;
  }

  const dx = DINO_X + 9;
  const dy = GROUND_Y - DINO_H + 6 + s.dinoY;
  const dw = DINO_W - 18;
  const dh = DINO_H - 10;
  for (const o of s.obstacles) {
    const scale = o.h / CACTUS_VH;
    const cw = CACTUS_VB * scale;
    if (aabb(dx, dy, dw, dh, o.x + 3, GROUND_Y - o.h + 3, cw - 6, o.h - 6)) {
      s.phase = 'over';
      if (s.score > s.best) s.best = s.score;
      break;
    }
  }
};

/* ----------------------------- 图形 ----------------------------- */
const Dino = ({ frame, jumping }: { frame: number; jumping: boolean }) => (
  <g fill="currentColor">
    <path d="M6 21 Q1 22 2 25 Q4 26 8 24 Z" />
    <rect x="5" y="16" width="22" height="14" rx="7" />
    <circle cx="29" cy="11" r="9" />
    <rect x="24" y="20" width="4" height="3.5" rx="1.75" />
    {jumping ? (
      <>
        <rect x="9" y="30" width="5" height="8" rx="2.5" />
        <rect x="19" y="30" width="5" height="8" rx="2.5" />
      </>
    ) : frame % 2 === 0 ? (
      <>
        <rect x="9" y="30" width="5" height="10" rx="2.5" />
        <rect x="19" y="30" width="5" height="5" rx="2.5" />
      </>
    ) : (
      <>
        <rect x="9" y="30" width="5" height="5" rx="2.5" />
        <rect x="19" y="30" width="5" height="10" rx="2.5" />
      </>
    )}
    <circle cx="32" cy="9" r="2.1" fill="#fff" />
    <circle cx="32.6" cy="9" r="1.1" fill="#0f172b" />
    <circle cx="24" cy="14" r="1.6" fill="#ffd9bf" />
  </g>
);

const Cactus = () => (
  <g fill="currentColor">
    <rect x="6" y="3" width="9" height="33" rx="4.5" />
    <rect x="3" y="13" width="5" height="3" rx="1.5" />
    <rect x="1" y="13" width="3" height="10" rx="1.5" />
    <rect x="13" y="17" width="5" height="3" rx="1.5" />
    <rect x="17" y="17" width="3" height="9" rx="1.5" />
  </g>
);

const Cloud = () => (
  <g fill="currentColor">
    <circle cx="8" cy="10" r="5.5" />
    <circle cx="17" cy="7" r="7.5" />
    <circle cx="28" cy="9" r="6.5" />
    <ellipse cx="18" cy="13" rx="16" ry="3.5" />
  </g>
);

const Hills = ({ offset }: { offset: number }) => {
  const w = 320;
  const shift = -(((offset % w) + w) % w);
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const x = shift + i * w;
        return (
          <path
            key={i}
            d={`M${x} ${GROUND_Y} Q${x + 80} ${GROUND_Y - 24} ${x + 160} ${GROUND_Y} Z`}
            fill="var(--color-hover)"
            opacity="0.6"
          />
        );
      })}
    </g>
  );
};

/* ----------------------------- 屏幕 ----------------------------- */
const CrashScreen = ({ error, onRetry }: { error: Error; onRetry: () => void }) => {
  const bestRef = useRef(0);
  const stateRef = useRef<GameState>(initialState(0));
  const [, render] = useReducer((c) => c + 1, 0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      step(stateRef.current);
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const jump = () => {
    const s = stateRef.current;
    if (s.phase === 'idle') {
      s.phase = 'running';
      s.velocity = JUMP;
    } else if (s.phase === 'running') {
      if (s.dinoY >= 0) s.velocity = JUMP;
    } else {
      stateRef.current = initialState(bestRef.current);
      stateRef.current.phase = 'running';
      stateRef.current.velocity = JUMP;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const s = stateRef.current;
  if (s.best > bestRef.current) bestRef.current = s.best;

  const scoreStr = String(Math.floor(s.score)).padStart(4, '0');
  const bestStr = String(Math.floor(bestRef.current)).padStart(4, '0');
  const dinoTopY = GROUND_Y - DINO_H + s.dinoY;
  const frame = Math.floor(s.frame / 6);

  return (
    <div role="alert" className="flex min-h-dvh flex-col items-center bg-surface px-6 py-10">
      <style>{`
        .crash-fade { animation: crash-fade .5s cubic-bezier(.22,.61,.36,1) both; }
        @keyframes crash-fade { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:none; } }
        @media (prefers-reduced-motion: reduce) { .crash-fade { animation: none; } }
      `}</style>

      <div className="flex w-full max-w-3xl flex-1 flex-col">
        {/* 错误标题：明显告知用户 */}
        <header className="crash-fade flex flex-col items-center gap-2 pb-6 text-center">
          <div className="flex items-center gap-2">
            <ExclamationCircleFilled
              className="text-base"
              style={{ color: 'var(--color-brand)' }}
            />
            <h1 className="m-0 text-lg font-semibold text-ink">页面开小差了</h1>
          </div>
          <p className="m-0 text-sm text-muted">渲染遇到了问题，可以先陪小恐龙跳一局，或直接重试</p>
        </header>

        {/* 游戏画面：与背景融为一体 */}
        <div
          className="flex flex-1 items-center"
          onMouseDown={(e) => {
            e.preventDefault();
            jump();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            jump();
          }}
        >
          <svg
            viewBox={`0 0 ${GAME_W} ${GAME_H}`}
            className="crash-fade block w-full cursor-pointer select-none"
            style={{ aspectRatio: `${GAME_W} / ${GAME_H}` }}
          >
            {/* 云 */}
            {s.clouds.map((c, i) => (
              <g
                key={i}
                style={{ color: 'var(--color-ghost)' }}
                transform={`translate(${c.x} ${c.y}) scale(${c.s})`}
              >
                <Cloud />
              </g>
            ))}

            {/* 远景丘陵 */}
            <Hills offset={s.hillScroll} />

            {/* 地面：淡色带，无强分隔线 */}
            <rect
              x="0"
              y={GROUND_Y}
              width={GAME_W}
              height={GAME_H - GROUND_Y}
              fill="var(--color-hover)"
              opacity="0.4"
            />
            <g transform={`translate(${-s.scroll % 44} 0)`}>
              {Array.from({ length: 20 }).map((_, i) => (
                <circle key={i} cx={i * 44} cy={GROUND_Y + 9} r="1.5" fill="var(--color-ghost)" />
              ))}
            </g>

            {/* 仙人掌 */}
            {s.obstacles.map((o, i) => {
              const scale = o.h / CACTUS_VH;
              return (
                <g
                  key={i}
                  style={{ color: 'var(--color-success)' }}
                  transform={`translate(${o.x} ${GROUND_Y - o.h}) scale(${scale})`}
                >
                  <Cactus />
                </g>
              );
            })}

            {/* 恐龙 */}
            <g
              style={{ color: 'var(--color-brand)' }}
              transform={`translate(${DINO_X} ${dinoTopY})`}
            >
              <Dino frame={frame} jumping={s.dinoY < 0} />
            </g>

            {/* 右上：分数 */}
            <text
              x={GAME_W - 20}
              y="30"
              textAnchor="end"
              fill="var(--color-muted)"
              style={{ font: '700 15px var(--font-mono)' }}
            >
              {scoreStr}
            </text>
            <text
              x={GAME_W - 20}
              y="46"
              textAnchor="end"
              fill="var(--color-faint)"
              style={{ font: '500 10px var(--font-mono)' }}
            >
              HI {bestStr}
            </text>

            {/* 居中提示 */}
            {s.phase !== 'running' && (
              <text
                x={GAME_W / 2}
                y={GROUND_Y - 56}
                textAnchor="middle"
                fill="var(--color-faint)"
                style={{ font: '500 13px var(--font-sans)' }}
              >
                {s.phase === 'idle' ? '按空格 / 点击开始' : `撞上了  ${scoreStr}  按空格再来`}
              </text>
            )}
          </svg>
        </div>

        {/* 底部：重试 */}
        <footer className="crash-fade flex flex-col items-center gap-3 pt-6">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none active:translate-y-0"
          >
            <ReloadOutlined className="text-sm" />
            重试
          </button>
          <code className="max-w-full truncate font-mono text-[11px] text-faint/70">
            {error.message || error.name}
          </code>
        </footer>
      </div>
    </div>
  );
};
