import { CheckCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';

export type TaskStatus = 'pending' | 'processing' | 'completed';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface AgentTask {
  id: string;
  title: string;
  desc: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: 'automation' | 'manual';
  sourceName: string;
  agentName: string;
  createdAt: string;
}

export interface TaskAgent {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export type TaskActivityType = 'created' | 'assigned' | 'accepted' | 'comment' | 'completed';

export interface TaskActivity {
  id: string;
  type: TaskActivityType;
  agentId: number;
  targetAgentId?: number;
  content?: string;
  time: string;
}

export const TASK_AGENTS: TaskAgent[] = [
  { id: 1, name: '总参谋部 Agent', icon: '📋', color: '#1677ff' },
  { id: 2, name: '纪律监察团 Agent', icon: '🔍', color: '#4b5563' },
  { id: 3, name: '情报侦察连 Agent', icon: '📡', color: '#00c758' },
  { id: 4, name: '工程突击营 Agent', icon: '⚙️', color: '#111111' },
  { id: 5, name: '中央兵工厂 Agent', icon: '🛡️', color: '#fb2c36' },
];

export const STATUS_MAP: Record<
  TaskStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending: { label: '待处理', color: '#fa8c16', bg: '#fa8c160f', icon: <ClockCircleOutlined /> },
  processing: { label: '处理中', color: '#1677ff', bg: '#1677ff0f', icon: <SyncOutlined /> },
  completed: { label: '已完成', color: '#52c41a', bg: '#52c41a0f', icon: <CheckCircleOutlined /> },
};

export const PRIORITY_MAP: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: '高优先级', color: '#f5222d' },
  medium: { label: '中优先级', color: '#fa8c16' },
  low: { label: '低优先级', color: '#8c8c8c' },
};

export const MOCK_TASKS: AgentTask[] = [
  {
    id: 't1',
    title: '审查 PR #42 的代码变更',
    desc: '自动审查 dataphin-fe/dpapp-dev 仓库最新推送，关注代码风格、潜在 bug 与性能问题',
    status: 'pending',
    priority: 'high',
    source: 'automation',
    sourceName: 'PR 推送自动审查',
    agentName: '纪律监察团 Agent',
    createdAt: '4 分钟前',
  },
  {
    id: 't2',
    title: '生成今日代码质量报告',
    desc: '汇总今日新增代码、修改文件与潜在问题，输出质量报告',
    status: 'processing',
    priority: 'medium',
    source: 'automation',
    sourceName: '每日代码质量报告',
    agentName: '总参谋部 Agent',
    createdAt: '今天 08:03',
  },
  {
    id: 't3',
    title: '排查线上接口超时告警',
    desc: '分析日志定位慢查询，给出修复建议并跟进解决',
    status: 'processing',
    priority: 'high',
    source: 'manual',
    sourceName: '手动创建',
    agentName: '情报侦察连 Agent',
    createdAt: '今天 10:21',
  },
  {
    id: 't4',
    title: '补充单元测试覆盖率报告',
    desc: '统计核心模块测试覆盖率并生成缺口清单',
    status: 'completed',
    priority: 'low',
    source: 'manual',
    sourceName: '手动创建',
    agentName: '工程突击营 Agent',
    createdAt: '昨天 16:40',
  },
  {
    id: 't5',
    title: '回复 Issue #88 的评论',
    desc: '自动响应仓库评论区反馈，整理问题并转交相关人员',
    status: 'completed',
    priority: 'medium',
    source: 'automation',
    sourceName: '评论自动响应',
    agentName: '中央兵工厂 Agent',
    createdAt: '昨天 14:30',
  },
  {
    id: 't6',
    title: '部署 v2.3 到预发环境',
    desc: '执行预发部署流程并验证核心功能是否正常',
    status: 'pending',
    priority: 'high',
    source: 'manual',
    sourceName: '手动创建',
    agentName: '工程突击营 Agent',
    createdAt: '昨天 11:05',
  },
];

export const MOCK_ACTIVITIES: Record<string, TaskActivity[]> = {
  t1: [
    { id: 't1-a1', type: 'created', agentId: 1, time: '今天 09:10' },
    { id: 't1-a2', type: 'assigned', agentId: 1, targetAgentId: 2, time: '今天 09:12' },
    { id: 't1-a3', type: 'accepted', agentId: 2, time: '今天 09:15' },
    {
      id: 't1-a4',
      type: 'comment',
      agentId: 2,
      content: '已开始审查，PR 包含 12 个文件变更，正在逐个核对',
      time: '今天 09:20',
    },
    {
      id: 't1-a5',
      type: 'comment',
      agentId: 2,
      content: '发现 stream_new_capacity 模块存在并发写入问题，建议重点修复',
      time: '今天 09:32',
    },
  ],
  t2: [
    { id: 't2-a1', type: 'created', agentId: 1, time: '今天 08:03' },
    { id: 't2-a2', type: 'accepted', agentId: 1, time: '今天 08:05' },
    {
      id: 't2-a3',
      type: 'comment',
      agentId: 1,
      content: '正在聚合今日代码变更数据',
      time: '今天 08:10',
    },
    {
      id: 't2-a4',
      type: 'comment',
      agentId: 3,
      content: '已提供今日全部提交记录清单，共 47 条',
      time: '今天 08:12',
    },
  ],
  t3: [
    { id: 't3-a1', type: 'created', agentId: 3, time: '今天 10:21' },
    { id: 't3-a2', type: 'accepted', agentId: 3, time: '今天 10:22' },
    {
      id: 't3-a3',
      type: 'comment',
      agentId: 3,
      content: '开始分析网关超时日志，定位慢查询',
      time: '今天 10:25',
    },
    {
      id: 't3-a4',
      type: 'comment',
      agentId: 4,
      content: '已定位到 order_query 慢 SQL，正在重写索引',
      time: '今天 10:40',
    },
  ],
  t4: [
    { id: 't4-a1', type: 'created', agentId: 1, time: '昨天 16:40' },
    { id: 't4-a2', type: 'assigned', agentId: 1, targetAgentId: 4, time: '昨天 16:42' },
    { id: 't4-a3', type: 'accepted', agentId: 4, time: '昨天 16:45' },
    {
      id: 't4-a4',
      type: 'comment',
      agentId: 4,
      content: '统计完成：自动化模块覆盖率 64%，需补充 12 个用例',
      time: '昨天 17:10',
    },
    { id: 't4-a5', type: 'completed', agentId: 4, time: '昨天 17:12' },
  ],
  t5: [
    { id: 't5-a1', type: 'created', agentId: 5, time: '昨天 14:30' },
    { id: 't5-a2', type: 'accepted', agentId: 5, time: '昨天 14:31' },
    {
      id: 't5-a3',
      type: 'comment',
      agentId: 5,
      content: '已整理用户反馈，问题已转交产品团队',
      time: '昨天 14:35',
    },
    { id: 't5-a4', type: 'completed', agentId: 5, time: '昨天 14:36' },
  ],
  t6: [
    { id: 't6-a1', type: 'created', agentId: 1, time: '昨天 11:05' },
    { id: 't6-a2', type: 'assigned', agentId: 1, targetAgentId: 4, time: '昨天 11:07' },
    { id: 't6-a3', type: 'accepted', agentId: 4, time: '昨天 11:10' },
    {
      id: 't6-a4',
      type: 'comment',
      agentId: 4,
      content: '预发环境已就绪，等待部署窗口',
      time: '昨天 11:20',
    },
  ],
};

export const getTaskById = (id: string): AgentTask | undefined =>
  MOCK_TASKS.find((t) => t.id === id);

export const getTaskAgent = (id: number): TaskAgent =>
  TASK_AGENTS.find((a) => a.id === id) ?? { id, name: '未知 Agent', icon: '🤖', color: '#999999' };
