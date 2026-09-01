import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Input, InputNumber } from 'antd';
import { Button, Select, Menu, type MenuProps } from '@brierb/brier-ui';
import {
  AppstoreOutlined,
  PlusOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  FolderOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Page, Table, Tag } from '@brierb/brier-ui';
import { agents, skills as allSkills } from '../../../../data/mockData';
import { RuntimeBadge } from '../../../../components/RuntimeIcon';
import { MODELS, SKILL_TYPE_MAP } from '../../../../define';
import type { Agent, Skill } from '../../../../types';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';

const RUNTIMES = ['Claude Code', 'Codex CLI', 'GPT-4o CLI', 'Gemini CLI'];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: '仅个人可用' },
  { value: 'public-all', label: '公开 · 所有人' },
  { value: 'public-joined', label: '公开 · 我加入的所有空间' },
  { value: 'public-specified', label: '公开 · 指定空间' },
];

const SPARKLINE_DATA = [
  0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const menuItems: MenuProps['items'] = [
  { key: 'overview', icon: <AppstoreOutlined />, label: '概览' },
  {
    type: 'group',
    label: '工作',
    children: [
      { key: 'new-chat', icon: <PlusOutlined />, label: '新会话' },
      { key: 'conversations', icon: <MessageOutlined />, label: '会话' },
    ],
  },
  {
    type: 'group',
    label: '能力与配置',
    children: [
      { key: 'skills', icon: <ThunderboltOutlined />, label: '技能' },
      { key: 'instructions', icon: <FileTextOutlined />, label: '指令' },
      { key: 'workdir', icon: <FolderOutlined />, label: '工作目录' },
    ],
  },
];

const INSTRUCTION_TEMPLATE = `# 角色定义
你是一个专业的 AI Agent，负责协助团队完成日常工作。

# 工作规范
- 遵循团队的编码规范和最佳实践
- 提交代码前进行自测和代码审查
- 使用清晰的 commit message
- 保持代码简洁，避免过度设计

# 协作要求
- 主动同步工作进展
- 遇到阻塞及时反馈
- 尊重他人的代码和文档`;

const MOCK_CONVERSATIONS = [
  { id: 1, title: '优化数据库查询性能', messages: 12, lastActive: '3 分钟前', status: '进行中' },
  { id: 2, title: '修复登录页 OAuth 回调', messages: 8, lastActive: '1 小时前', status: '已完成' },
  { id: 3, title: '重构 API 服务层架构', messages: 15, lastActive: '2 小时前', status: '已完成' },
  { id: 4, title: '编写单元测试覆盖率报告', messages: 6, lastActive: '昨天', status: '已完成' },
  { id: 5, title: '部署 v2.3 到预发环境', messages: 9, lastActive: '3 天前', status: '已完成' },
];

interface ChatMessage {
  id: number;
  role: 'user' | 'agent';
  content: string;
}

const PropertyRow = ({ label, children }: { label: string; children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-standard">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
};

const Sparkline = ({ data }: { data: number[] }) => {
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
};

const AgentAvatar = ({ agent, size = 32 }: { agent: Agent; size?: number }) => {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md"
      style={{
        width: size,
        height: size,
        backgroundColor: agent.color + '1a',
        fontSize: size * 0.5,
      }}
    >
      {agent.icon}
    </div>
  );
};

const OverviewTab = ({
  agent,
  runtime,
  setRuntime,
  model,
  setModel,
  visibility,
  setVisibility,
  concurrency,
  setConcurrency,
}: {
  agent: Agent;
  runtime: string;
  setRuntime: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  visibility: string;
  setVisibility: (v: string) => void;
  concurrency: number;
  setConcurrency: (v: number) => void;
}) => {
  return (
    <div className="flex min-w-0 flex-1 gap-8 overflow-hidden px-4 py-3">
      <div className="w-[300px] min-w-0 shrink-0 overflow-auto rounded-xl border border-ghost">
        <div className="flex flex-col items-start gap-4 border-b border-ghost p-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-xl text-3xl"
            style={{ background: `${agent.color}0d`, border: `1px solid ${agent.color}22` }}
          >
            {agent.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{agent.name}</h1>
              <StatusBadge status={agent.status} />
            </div>
            <p className="mt-0.5 text-standard">{agent.desc}</p>
          </div>
        </div>

        <div className="border-b border-ghost px-4 py-3">
          <div className="mb-2 text-standard font-bold">属性</div>
          <div>
            <PropertyRow label="工作电脑">
              <Button bordered={false}>{agent.workComputer}</Button>
            </PropertyRow>
            <PropertyRow label="运行时">
              <Select
                value={runtime}
                onChange={setRuntime}
                options={RUNTIMES.map((r) => ({
                  value: r,
                  label: <RuntimeBadge name={r} size={12} />,
                }))}
                button={{
                  bordered: false,
                }}
              />
            </PropertyRow>
            <PropertyRow label="模型">
              <Select
                value={model}
                onChange={setModel}
                options={MODELS.map((m) => ({ value: m, label: m }))}
                button={{
                  bordered: false,
                }}
              />
            </PropertyRow>
            <PropertyRow label="可见性">
              <Select
                value={visibility}
                onChange={setVisibility}
                options={VISIBILITY_OPTIONS}
                button={{
                  bordered: false,
                }}
              />
            </PropertyRow>
            <PropertyRow label="并发">
              <InputNumber
                value={concurrency}
                onChange={(v) => setConcurrency(v ?? 1)}
                min={1}
                max={20}
                size="small"
                className="w-20"
              />
            </PropertyRow>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="mb-2 text-standard font-bold">操作</div>
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-ghost pb-2">
              <div className="flex-1">
                <div className="text-standard font-medium">默认 Agent</div>
                <p className="mt-1 text-xs">设为你的"主力" Agent — 接受指派时的默认人选</p>
              </div>
              <Button>设为默认</Button>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex-1">
                <div className="text-standard font-medium">删除 Agent</div>
                <p className="mt-1 text-xs">
                  删除后 Agent 会从日常列表和指派选项中隐藏，历史任务与会话记录会保留
                </p>
              </div>
              <Button>删除</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 shrink-0 overflow-auto">
        <div className="mb-6">
          <div className="mb-3 text-standard font-bold">进行中的会话</div>
          <div className="rounded-lg border border-ghost p-4">
            <p className="text-xs">当前没有进行中的会话</p>
          </div>
        </div>
        <div className="mb-6">
          <div className="mb-3 text-standard font-bold">近 30 天</div>
          <div className="rounded-lg border border-ghost p-4">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-bold tabular-nums">
                {agent.runs > 0 ? agent.runs : 1}
              </span>
              <span className="text-xs">次运行</span>
            </div>
            <div className="mt-2">
              <Sparkline data={SPARKLINE_DATA} />
            </div>
          </div>
        </div>
        <div>
          <div className="mb-3 text-standard font-bold">最近 Agent 事项</div>
          <div className="rounded-lg border border-ghost p-4">
            <p className="text-xs">将 Agent 事项指派给该 Agent 后，会展示在这里</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewChatTab = ({ agent }: { agent: Agent }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'agent',
          content: `收到！我是${agent.name}，正在处理你的请求："${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"\n\n这是一个模拟响应，实际接入 Agent 后将返回真实结果。`,
        },
      ]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <AgentAvatar agent={agent} size={48} />
          <div className="text-lg font-bold">{agent.name}</div>
          <p className="text-standard">{agent.desc}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex items-start justify-end gap-3">
                  <div className="max-w-[75%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-white">
                    <p className="text-standard leading-relaxed break-words whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                  {user?.avatar_url ? (
                    <Avatar size={32} src={user.avatar_url} className="shrink-0 !rounded-[8px]" />
                  ) : (
                    <Avatar
                      size={32}
                      className="shrink-0 !rounded-[8px] !bg-[linear-gradient(135deg,#0a0a0a,#3a3a3a)]"
                    >
                      {user?.username?.slice(0, 2).toUpperCase() ?? 'U'}
                    </Avatar>
                  )}
                </div>
              ) : (
                <div key={msg.id} className="flex items-start gap-3">
                  <AgentAvatar agent={agent} size={32} />
                  <div className="flex max-w-[75%] flex-col gap-1">
                    <div className="text-[11px] font-medium">{agent.name}</div>
                    <div className="rounded-2xl rounded-bl-md border border-ghost px-4 py-2.5">
                      <p className="text-standard leading-relaxed break-words whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
            {loading && (
              <div className="flex items-start gap-3">
                <AgentAvatar agent={agent} size={32} />
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-medium">{agent.name}</div>
                  <div className="rounded-2xl rounded-bl-md border border-ghost px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
                      <span className="size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
                      <span className="size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-ghost px-4 pt-2 pb-4">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-ghost bg-white shadow-sm transition-colors focus-within:border-brand">
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`给 ${agent.name} 发送消息…`}
              autoSize={{ minRows: 1, maxRows: 4 }}
              variant="borderless"
              className="!px-4 !py-3 !text-standard"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1.5 rounded-lg px-2 py-1">
                <AgentAvatar agent={agent} size={20} />
                <span className="text-xs font-medium">{agent.name}</span>
              </div>
              <Button
                type="primary"
                shape="circle"
                size="small"
                icon={<ArrowUpOutlined />}
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="shrink-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConversationsTab = () => {
  const columns: ColumnsType<(typeof MOCK_CONVERSATIONS)[0]> = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (t: string) => <span className="font-medium">{t}</span>,
    },
    {
      title: '消息数',
      dataIndex: 'messages',
      render: (n: number) => <span className="font-mono text-xs tabular-nums">{n}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag color={s === '进行中' ? '#1677ff' : '#90a1b9'}>{s}</Tag>,
    },
    {
      title: '最近活跃',
      dataIndex: 'lastActive',
      render: (t: string) => <span className="text-xs">{t}</span>,
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-3xl">
        <div className="mb-3 text-standard font-bold">历史会话</div>
        <Table
          bordered
          columns={columns}
          dataSource={MOCK_CONVERSATIONS}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  );
};

const SkillsTab = ({ agent }: { agent: Agent }) => {
  const [boundSkills, setBoundSkills] = useState<Skill[]>(
    allSkills.filter((_, i) => i < agent.skills),
  );

  const handleRemove = (name: string) => {
    setBoundSkills((prev) => prev.filter((s) => s.name !== name));
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-standard font-bold">绑定的 Skills</div>
            <p className="mt-0.5 text-xs">该 Agent 可使用的技能</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            添加 Skill
          </Button>
        </div>
        <div className="divide-y divide-ghost overflow-hidden rounded-lg border border-ghost">
          {boundSkills.map((skill) => (
            <div key={skill.name} className="flex items-center gap-3 bg-white px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md">
                <ToolOutlined className="text-standard" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-standard font-medium">{skill.name}</span>
                  <Tag color={SKILL_TYPE_MAP[skill.type].color}>
                    {skill.type === 'builtin' ? 'Plugin 内置' : SKILL_TYPE_MAP[skill.type].label}
                  </Tag>
                </div>
                <div className="mt-0.5 text-xs leading-relaxed">{skill.desc}</div>
              </div>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(skill.name)}
              />
            </div>
          ))}
          {boundSkills.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-standard">暂未绑定任何 Skill</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InstructionsTab = () => {
  const [instructions, setInstructions] = useState('');

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-standard font-bold">指令</span>
          <Button size="small" onClick={() => setInstructions(INSTRUCTION_TEMPLATE)}>
            插入模版
          </Button>
        </div>
        <p className="mb-4 text-xs">为该 Agent 提供自定义指令和上下文</p>
        <Input.TextArea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={
            '默认使用中文回复\n回复保持简洁，结论优先\n修改代码后运行项目检查\n在已授权仓库内可以直接完成代码修改'
          }
          rows={12}
          className="resize-none"
        />
      </div>
    </div>
  );
};

const WorkDirTab = () => {
  const [path, setPath] = useState('');

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl">
        <div className="mb-1 text-standard font-bold">工作目录</div>
        <p className="mb-4 text-xs">Agent 执行任务时使用的工作目录，填写本机绝对路径</p>
        <Input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/Users/username/project"
          className="font-mono"
        />
        <div className="mt-4">
          <Button type="primary">保存</Button>
        </div>
      </div>
    </div>
  );
};

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('overview');
  const [runtime, setRuntime] = useState(RUNTIMES[0]);
  const [model, setModel] = useState(MODELS[0]);
  const [visibility, setVisibility] = useState(VISIBILITY_OPTIONS[1].value);
  const [concurrency, setConcurrency] = useState(6);

  const agent = agents.find((a) => a.id === Number(id));

  if (!agent) {
    return (
      <Page header={<span className="">Agent 未找到</span>}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-standard">未找到该 Agent</p>
            <Button onClick={() => navigate('/space/agents')}>返回列表</Button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      header={
        <>
          <span className="cursor-pointer" onClick={() => navigate('/space/agents')}>
            Agents
          </span>
          <span className="">/</span>
          <span className="font-medium">{agent.name}</span>
        </>
      }
    >
      <div className="flex h-full overflow-hidden">
        <div className="w-52 shrink-0 overflow-auto border-r border-ghost p-2">
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            onClick={({ key }) => setActiveKey(key)}
            items={menuItems}
          />
        </div>

        {activeKey === 'overview' && (
          <OverviewTab
            agent={agent}
            runtime={runtime}
            setRuntime={setRuntime}
            model={model}
            setModel={setModel}
            visibility={visibility}
            setVisibility={setVisibility}
            concurrency={concurrency}
            setConcurrency={setConcurrency}
          />
        )}
        {activeKey === 'new-chat' && <NewChatTab agent={agent} />}
        {activeKey === 'conversations' && <ConversationsTab />}
        {activeKey === 'skills' && <SkillsTab agent={agent} />}
        {activeKey === 'instructions' && <InstructionsTab />}
        {activeKey === 'workdir' && <WorkDirTab />}
      </div>
    </Page>
  );
};
export default AgentDetail;
