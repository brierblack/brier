import { Spin } from 'antd';
import { Button } from '@brierb/brier-ui';
import { useAuth } from '../../auth-context';

const BrierLogo = ({ size = 48 }: { size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient
          id="logoGrad"
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="20%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="78%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path
        d="M50 32 L66 41.5 L66 59.5 L50 69 L34 59.5 L34 41.5 Z"
        fill="none"
        stroke="url(#logoGrad)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M34 41.5 Q19 39 17 50 Q19 61.5 29 56"
        fill="none"
        stroke="url(#logoGrad)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M66 41.5 Q81 39 83 50 Q81 61.5 71 56"
        fill="none"
        stroke="url(#logoGrad)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="50" cy="50" r="2.5" fill="url(#logoGrad)" />
    </svg>
  );
};

const GitHubIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
};

const GiteeIcon = ({ className }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 16 16" width="20" height="20">
      <circle cx="8" cy="8" r="8" fill="#c71d23" />
      <path
        d="M4.6 8.1a3.5 3.5 0 0 1 7 0"
        stroke="#fff"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8.1" r="1" fill="#fff" />
    </svg>
  );
};

/** 可用的 OAuth 登录提供方。新增厂商（gitlab 等）时在此追加一项。 */
const PROVIDERS = [
  { key: 'github', label: 'GitHub', icon: <GitHubIcon /> },
  { key: 'gitee', label: 'Gitee', icon: <GiteeIcon /> },
] as const;

const FEATURES = [
  { icon: '🤖', title: '多 Agent 协作', desc: '编排 Agent 团队，自动化复杂工作流' },
  { icon: '💻', title: '工作电脑直连', desc: '连接本地或远程机器，实时执行任务' },
  { icon: '🔧', title: '技能扩展', desc: '安装 Skills 和 MCP 工具，无限扩展能力' },
];

const Login = () => {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (user) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Animated flowing background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(254,110,0,0.25), transparent), radial-gradient(ellipse 70% 50% at 80% 60%, rgba(111,92,240,0.25), transparent), radial-gradient(ellipse 60% 40% at 50% 20%, rgba(196,74,216,0.15), transparent)',
          }}
        />
        {/* Flowing light orbs */}
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 500,
            height: 500,
            top: '-10%',
            left: '5%',
            background: 'radial-gradient(circle, rgba(254,110,0,0.3), transparent 70%)',
            animation: 'float1 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 400,
            height: 400,
            bottom: '-5%',
            right: '10%',
            background: 'radial-gradient(circle, rgba(111,92,240,0.3), transparent 70%)',
            animation: 'float2 22s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 350,
            height: 350,
            top: '40%',
            left: '40%',
            background: 'radial-gradient(circle, rgba(196,74,216,0.2), transparent 70%)',
            animation: 'float3 15s ease-in-out infinite',
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex w-full items-center">
        {/* Left brand panel */}
        <div className="hidden h-full w-[52%] flex-col justify-between py-12 pr-8 pl-16 lg:flex">
          <div className="flex items-center gap-3">
            <BrierLogo size={44} />
            <div>
              <div className="text-xl font-bold tracking-tight text-white">Brier</div>
              <div className="text-[11px] text-white/40">AI Agent Workspace</div>
            </div>
          </div>

          <div className="-mt-10 flex flex-1 flex-col justify-center">
            <div
              className="mb-4 text-5xl leading-[1.15] font-bold tracking-tight text-white"
              style={{
                background: 'linear-gradient(135deg, #fff 0%, #fff 40%, #fe6e00 70%, #c44ad8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              让 AI Agent
              <br />
              真正参与开发
            </div>
            <p className="mb-12 max-w-md text-standard leading-relaxed text-white/50">
              连接代码仓库与工作电脑，编排多 Agent 团队， 将复杂工作流交给 AI 自主完成。
            </p>

            <div className="max-w-md space-y-3.5">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 opacity-0"
                  style={{
                    animation: `slideIn 0.6s ease-out ${0.3 + i * 0.15}s forwards`,
                  }}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-lg">
                    {f.icon}
                  </div>
                  <div>
                    <div className="text-standard font-medium text-white/90">{f.title}</div>
                    <div className="mt-0.5 text-xs text-white/40">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-white/25">© 2026 Brier. All rights reserved.</div>
        </div>

        {/* Right login panel */}
        <div className="flex h-full flex-1 items-center justify-center px-8">
          <div className="w-full max-w-sm" style={{ animation: 'fadeUp 0.7s ease-out 0.2s both' }}>
            {/* Glass card */}
            <div
              className="rounded-[28px] p-9"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow:
                  '0 24px 48px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Mobile logo */}
              <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
                <BrierLogo size={40} />
                <span className="text-lg font-bold text-white">Brier</span>
              </div>

              <div className="mb-7 text-center">
                <h2 className="mb-1.5 text-2xl font-bold tracking-tight text-white">欢迎回来</h2>
                <p className="text-standard text-white/45">登录你的账户，继续工作</p>
              </div>

              <div className="space-y-3">
                {PROVIDERS.map((p) => (
                  <Button
                    key={p.key}
                    block
                    size="large"
                    className="!h-12 !rounded-xl !border-white !bg-white font-medium !text-[#1f2328] hover:!border-white/90 hover:!bg-white/90"
                    icon={p.icon}
                    iconPosition="start"
                    onClick={() => login(p.key)}
                  >
                    使用 {p.label} 登录
                  </Button>
                ))}
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-xs text-white/30">或</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-center gap-2 text-xs text-white/40">
                  <span className="size-1.5 rounded-full" style={{ background: '#00c758' }} />
                  <span>所有服务运行正常</span>
                </div>
                <p className="text-center text-xs leading-relaxed text-white/30">
                  登录即表示你同意我们的
                  <a
                    href="#"
                    className="text-white/60 underline-offset-2 hover:text-white hover:underline"
                  >
                    服务条款
                  </a>{' '}
                  和{' '}
                  <a
                    href="#"
                    className="text-white/60 underline-offset-2 hover:text-white hover:underline"
                  >
                    隐私政策
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(80px, -40px) scale(1.1); }
          66% { transform: translate(-30px, 50px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-60px, 40px) scale(1.08); }
          66% { transform: translate(40px, -30px) scale(0.92); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(60px, -60px) scale(1.15); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
export default Login;
