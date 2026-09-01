import { Button } from '@brierb/brier-ui';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { GitHub, GitLab, Gitee } from '@/components/Icon';

const BrierLogo = ({ size = 48 }: { size?: number }) => {
  return <Logo style={{ width: size, height: size }} />;
};

/** 可用的 OAuth 登录提供方。新增厂商时在此追加一项。 */
const PROVIDERS = [
  { key: 'github', label: 'GitHub', icon: <GitHub size={20} /> },
  { key: 'gitlab', label: 'GitLab', icon: <GitLab size={20} /> },
  { key: 'gitee', label: 'Gitee', icon: <Gitee size={20} /> },
] as const;

const FEATURES = [
  { icon: '🤖', title: '多 Agent 协作', desc: '编排 Agent 团队，自动化复杂工作流' },
  { icon: '💻', title: '工作电脑直连', desc: '连接本地或远程机器，实时执行任务' },
  { icon: '🔧', title: '技能扩展', desc: '安装 Skills 和 MCP 工具，无限扩展能力' },
];

const Login = () => {
  const { login } = useAuth();

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Animated flowing background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(255,255,255,0.08), transparent), radial-gradient(ellipse 70% 50% at 80% 60%, rgba(255,255,255,0.06), transparent), radial-gradient(ellipse 60% 40% at 50% 20%, rgba(255,255,255,0.05), transparent)',
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
            background: 'radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)',
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
            background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)',
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
                background: 'linear-gradient(135deg, #fff 0%, #fff 45%, #9ca3af 100%)',
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
