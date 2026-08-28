import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Segmented, Input } from 'antd';
import { Button, Page, Tag } from '@brierb/brier-ui';
import {
  PlusOutlined,
  SearchOutlined,
  ScheduleOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { MOCK_TASKS, PRIORITY_MAP, STATUS_MAP } from './data';

const AgentTasks = () => {
  const navigate = useNavigate();
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
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
                    <span
                      className="flex size-4 items-center justify-center rounded-full bg-[#fa8c16]/10 text-[10px] font-medium"
                      style={{ color: '#fa8c16' }}
                    >
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
                    <span
                      className="flex size-4 items-center justify-center rounded-full bg-[#1677ff]/10 text-[10px] font-medium"
                      style={{ color: '#1677ff' }}
                    >
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
                    <span
                      className="flex size-4 items-center justify-center rounded-full bg-[#52c41a]/10 text-[10px] font-medium"
                      style={{ color: '#52c41a' }}
                    >
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
                onClick={() => navigate(`/space/agent-tasks/${task.id}`)}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-ghost bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{
                    background: status.bg,
                    border: `1px solid ${status.color}22`,
                    color: status.color,
                  }}
                >
                  {status.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-standard font-medium">{task.title}</span>
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
