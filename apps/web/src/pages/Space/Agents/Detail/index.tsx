import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Input, InputNumber } from 'antd';
import { Button, Select, Menu, type MenuProps } from '@brierb/brier-ui';
import {
  AppstoreOutlined,
  PlusOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  FolderOutlined,
  DeleteOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Avatar, Page, Table, Tag } from '@brierb/brier-ui';
import { skills as allSkills } from '../../../../data/mockData';
import { createSession, deleteAgent, listAgents, updateAgent } from '@/api/generated';
import { useSpace } from '@/context/SpaceContext';
import { useRequest } from '@/hooks/useRequest';
import { RuntimeBadge } from '../../../../components/RuntimeIcon';
import { AI_RUNTIMES, MODELS, SKILL_TYPE_MAP } from '../../../../define';
import type { Agent, Skill } from '../../../../types';
import { StatusBadge } from '@/components/StatusBadge';
import { SessionThread } from '../../Session/thread';
import { InputBox } from '../../Session/shared';

// Agent 运行时展示：优先真实绑定的 runtime；下拉选项为受支持注册表
// （与 CLI RUNTIME_REGISTRY / 新建页兜底清单同源）。

const VISIBILITY_OPTIONS = [
  { value: 'private', label: '仅个人可用' },
  { value: 'public-all', label: '公开 · 所有人' },
  { value: 'public-joined', label: '公开 · 我加入的所有空间' },
  { value: 'public-specified', label: '公开 · 指定空间' },
];

/** 前端可见性选项值 → 后端 (visibility, public_scope) */
const visibilityToBackend = (v: string) => {
  switch (v) {
    case 'private':
      return { visibility: 'private' as const };
    case 'public-joined':
      return { visibility: 'public' as const, public_scope: 'joined_spaces' as const };
    case 'public-specified':
      return { visibility: 'public' as const, public_scope: 'specified_spaces' as const };
    default:
      return { visibility: 'public' as const, public_scope: 'all' as const };
  }
};

/** 后端 Agent → 前端可见性选项值 */
const agentToVisibility = (a: Agent): string => {
  if (a.visibility === 'private') return 'private';
  if (a.public_scope === 'joined_spaces') return 'public-joined';
  if (a.public_scope === 'specified_spaces') return 'public-specified';
  return 'public-all';
};

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
  onDelete,
  onSave,
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
  onDelete: () => void;
  onSave: () => void;
}) => {
  return (
    <div className="flex min-w-0 flex-1 gap-8 overflow-hidden px-4 py-3">
      <div className="w-75 min-w-0 shrink-0 overflow-auto rounded-xl border border-ghost">
        <div className="flex flex-col items-start gap-4 border-b border-ghost p-4">
          <Avatar src={agent.avatar ?? undefined} shape="square" size={56} alt={agent.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{agent.name}</h1>
              <StatusBadge status={agent.status} />
            </div>
            <p className="mt-0.5 text-standard">{agent.description ?? ''}</p>
          </div>
        </div>

        <div className="border-b border-ghost px-4 py-3">
          <div className="mb-2 text-standard font-bold">属性</div>
          <div>
            <PropertyRow label="工作电脑">
              <Button bordered={false}>{agent.work_computer_id ?? '—'}</Button>
            </PropertyRow>
            <PropertyRow label="运行时">
              <Select
                value={runtime}
                onChange={setRuntime}
                options={AI_RUNTIMES.map((r) => ({
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
                <div className="text-standard font-medium">保存配置</div>
                <p className="mt-1 text-xs">保存上方修改的运行时与可见性设置</p>
              </div>
              <Button type="primary" size="small" onClick={onSave}>
                保存
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-ghost py-2">
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
              <Button danger onClick={onDelete}>
                删除
              </Button>
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
              <span className="font-mono text-2xl font-bold tabular-nums">0</span>
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

/** Agent 详情内"新会话"：与 /space/session 相同的会话线程逻辑，Agent 锁定为当前详情对象。
 *  首条消息创建真实会话（后端落库）后进入线程；会话状态提升到 AgentDetailBody，
 *  切换 tab 再回来不丢上下文，且历史已有回复时不会重复下发首条。 */
const NewChatTab = ({
  agent,
  wsId,
  chat,
  onStart,
}: {
  agent: Agent;
  wsId: string;
  /** 进行中的会话（null = 未开始，展示"新会话"首屏） */
  chat: { sessionId: string; bootPrompt: string } | null;
  onStart: (c: { sessionId: string; bootPrompt: string }) => void;
}) => {
  const { message } = App.useApp();
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 首条发送：创建真实会话（后端落库首条 user 消息）→ 进入会话线程自动执行任务
  const handleStart = async () => {
    const text = input.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const session = await createSession(wsId, {
        agent_id: agent.id,
        first_message: text,
      });
      onStart({ sessionId: session.id, bootPrompt: text });
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建会话失败');
      setSubmitting(false);
    }
  };

  if (!chat) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
          <Avatar src={agent.avatar ?? undefined} shape="square" size={48} alt={agent.name} />
          <div className="text-center">
            <h2 className="text-lg font-bold">和 {agent.name} 开始新会话</h2>
            <p className="mt-1 text-sm text-muted">
              消息将下发到该 Agent 绑定的工作电脑执行，会话记录会保存在会话列表
            </p>
          </div>
          <div className="w-full max-w-2xl">
            <InputBox
              agent={agent}
              agents={[agent]}
              value={input}
              onChange={setInput}
              onSend={() => void handleStart()}
              loading={submitting}
              onAgentSelect={() => {}}
            />
          </div>
        </div>
      </div>
    );
  }

  // 会话已建立：与 /space/session/:id 相同逻辑（Agent 由会话绑定锁定，不可切换）
  return (
    <SessionThread
      key={chat.sessionId}
      wsId={wsId}
      sessionId={chat.sessionId}
      autoRun={{ prompt: chat.bootPrompt }}
    />
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

const SkillsTab = () => {
  const [boundSkills, setBoundSkills] = useState<Skill[]>(allSkills.filter((_, i) => i < 3));

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

const WorkDirTab = ({
  agent,
  onSave,
}: {
  agent: Agent;
  onSave: (workdir: string) => Promise<void>;
}) => {
  const [path, setPath] = useState('');
  const [saving, setSaving] = useState(false);

  // 跟随 Agent 真实工作目录
  useEffect(() => {
    setPath(agent.workdir ?? '');
  }, [agent.workdir]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(path.trim());
    } finally {
      setSaving(false);
    }
  };

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
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};

const AgentDetailBody = ({ wsId }: { wsId: string }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [activeKey, setActiveKey] = useState('overview');
  const [runtime, setRuntime] = useState<string | undefined>(undefined);
  const [model, setModel] = useState(MODELS[0]);
  const [visibility, setVisibility] = useState('');
  const [concurrency, setConcurrency] = useState(6);
  // Agent 详情内"新会话"：进行中的会话（提升到本层，切换 tab 不丢失；切 Agent 时重置）
  const [newChat, setNewChat] = useState<{ sessionId: string; bootPrompt: string } | null>(null);

  const { data: agents, run: reloadAgents } = useRequest(listAgents, [wsId]);

  const agent = (agents ?? []).find((a) => a.id === id);

  // 切换到其它 Agent 时清空"新会话"上下文
  useEffect(() => {
    setNewChat(null);
  }, [agent?.id]);

  // 展示/编辑态跟随 Agent 真实配置（数据到达后同步）
  useEffect(() => {
    if (!agent) return;
    if (agent.runtime) setRuntime(agent.runtime);
    setVisibility(agentToVisibility(agent));
  }, [agent?.id, agent?.runtime, agent?.visibility, agent?.public_scope]);

  /** 保存概览属性（runtime + 可见性） */
  const handleSaveConfig = async () => {
    if (!agent) return;
    try {
      await updateAgent(wsId, agent.id, {
        runtime: runtime || null,
        ...visibilityToBackend(visibility),
      });
      message.success('已保存');
      reloadAgents(wsId);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
    }
  };

  /** 保存工作目录 */
  const handleSaveWorkdir = async (workdir: string) => {
    if (!agent) return;
    try {
      await updateAgent(wsId, agent.id, { workdir });
      message.success('工作目录已保存');
      reloadAgents(wsId);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败');
      throw e;
    }
  };

  /** 删除 Agent：确认后调 DELETE，成功后返回列表 */
  const handleDelete = () => {
    if (!agent) return;
    modal.confirm({
      title: `删除 Agent「${agent.name}」`,
      content: '删除后该 Agent 将从空间移除，无法再被指派或下发任务。确定删除吗？',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteAgent(wsId, agent.id);
          message.success('已删除');
          navigate('/space/agents');
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败');
        }
      },
    });
  };

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
            runtime={runtime ?? ''}
            setRuntime={setRuntime}
            model={model}
            setModel={setModel}
            visibility={visibility}
            setVisibility={setVisibility}
            concurrency={concurrency}
            setConcurrency={setConcurrency}
            onDelete={handleDelete}
            onSave={() => void handleSaveConfig()}
          />
        )}
        {activeKey === 'new-chat' && (
          <NewChatTab agent={agent} wsId={wsId} chat={newChat} onStart={(c) => setNewChat(c)} />
        )}
        {activeKey === 'conversations' && <ConversationsTab />}
        {activeKey === 'skills' && <SkillsTab />}
        {activeKey === 'instructions' && <InstructionsTab />}
        {activeKey === 'workdir' && <WorkDirTab agent={agent} onSave={handleSaveWorkdir} />}
      </div>
    </Page>
  );
};

const AgentDetailContent = () => {
  const { currentSpaceId } = useSpace();
  if (!currentSpaceId) {
    return (
      <Page header={<span>无可用空间</span>}>
        <div className="flex h-full items-center justify-center text-sm text-muted">
          请先创建工作空间
        </div>
      </Page>
    );
  }
  return <AgentDetailBody wsId={currentSpaceId} />;
};

export default AgentDetailContent;
