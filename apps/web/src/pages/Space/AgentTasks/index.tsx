import { useMemo, useState } from 'react';
import { App, Segmented, Input } from 'antd';
import { Button, Page, Tag } from '@brierb/ui';
import {
  PlusOutlined,
  SearchOutlined,
  ScheduleOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';

type TaskStatus = 'pending' | 'processing' | 'completed';
type TaskPriority = 'high' | 'medium' | 'low';

interface AgentTask {
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

const STATUS_MAP: Record<TaskStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: {
    label: '待处理',
    color: '#fa8c16',
    bg: '#fa8c160f',
    icon: <ClockCircleOutlined />,
  },
  processing: {
    label: '处理中',
    color: '#1677ff',
    bg: '#1677ff0f',
    icon: <SyncOutlined />,
  },
  completed: {
    label: '已完成',
    color: '#52c41a',
    bg: '#52c41a0f',
    icon: <CheckCircleOutlined />,
  },
};

const PRIORITY_MAP: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: '高优先级', color: '#f5222d' },
  medium: { label: '中优先级', color: '#fa8c16' },
  low: { label: '低优先级', color: '#8c8c8c' },
};

const MOCK_TASKS: AgentTask[] = [
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

const AgentTasks = () => {
  const { message } = App.useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const countByStatus = useMemo(() => {
    const counts = { pending: 0, processing: 0, completed: 0 };
    MOCK_TASKS.forEach((t) => {
      counts[t.status] += 1;
    });
    return counts;
  }, []);

  const filteredTasks = useMemo(() => {
    return MOCK_TASKS.filter((t) => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [statusFilter, search]);

  const handleNew = () => {
    message.info('新建事项功能开发中');
  };

  return (
    <Page
      title="Agent 事项"
      subtitle="查看和管理 Agent 自动创建或手动创建的事项任务"
      extra={
        <div className="flex items-center gap-3">
          <Button icon={<ScheduleOutlined />}>我的事项</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNew}
          >
            新建事项
          </Button>
        </div>
      }
    >
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <Segmented
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as string)}
            options={[
              { label: `全部 ${MOCK_TASKS.length}`, value: 'all' },
              {
                label: (
                  <span className="flex items-center gap-1">
                    待处理
                    <span className="flex size-4 items-center justify-center rounded-full bg-[#fa8c16]/10 text-[10px] font-medium" style={{ color: '#fa8c16' }}>
                      {countByStatus.pending}
                    </span>
                  </span>
                ),
                value: 'pending',
              },
              {
                label: (
                  <span className="flex items-center gap-1">
                    处理中
                    <span className="flex size-4 items-center justify-center rounded-full bg-[#1677ff]/10 text-[10px] font-medium" style={{ color: '#1677ff' }}>
                      {countByStatus.processing}
                    </span>
                  </span>
                ),
                value: 'processing',
              },
              {
                label: (
                  <span className="flex items-center gap-1">
                    已完成
                    <span className="flex size-4 items-center justify-center rounded-full bg-[#52c41a]/10 text-[10px] font-medium" style={{ color: '#52c41a' }}>
                      {countByStatus.completed}
                    </span>
                  </span>
                ),
                value: 'completed',
              },
            ]}
          />
          <Input
            placeholder="搜索事项..."
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>

        <div className="flex flex-col gap-3">
          {filteredTasks.map((task) => {
            const status = STATUS_MAP[task.status];
            const priority = PRIORITY_MAP[task.priority];
            return (
              <div
                key={task.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-ghost bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ background: status.bg, border: `1px solid ${status.color}22`, color: status.color }}
                >
                  {status.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-standard">{task.title}</span>
                    <Tag color={priority.color} className="m-0">
                      {priority.label}
                    </Tag>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">{task.desc}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <ThunderboltOutlined className="text-muted" />
                      <span className="font-medium">{task.sourceName}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <RobotOutlined className="text-muted" />
                      <span className="font-medium">{task.agentName}</span>
                    </span>
                    <span className="text-muted">{task.createdAt}</span>
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
              </div>
            );
          })}
          {filteredTasks.length === 0 && (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-ghost text-sm text-muted">
              暂无匹配的事项
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};

export default AgentTasks;
