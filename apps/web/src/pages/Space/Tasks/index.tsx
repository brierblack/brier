import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Form, Input, Modal, Segmented, Select } from 'antd';
import { Button, Page, Tag } from '@brierb/brier-ui';
import {
  PlusOutlined,
  RobotOutlined,
  ScheduleOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { createTask, listAgents, listTasks } from '@/api/generated';
import type { Agent, TaskPriority, TaskStatus } from '@/api/generated';
import { useRequest } from '@/hooks/useRequest';
import { useTaskEvents } from '@/hooks/useTaskEvents';
import { useSpace } from '@/context/SpaceContext';
import { RuntimeBadge } from '../../../components/RuntimeIcon';
import { formatTime, PRIORITY_META, SOURCE_LABEL, STATUS_META } from './data';

const FILTER_OPTIONS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待执行', value: 'pending' },
  { label: '执行中', value: 'running' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
  { label: '已取消', value: 'cancelled' },
];

const NewTaskModal = ({
  open,
  onClose,
  agents,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  agents: Agent[];
  onCreated: (taskId: string) => void;
}) => {
  const { message } = App.useApp();
  const { currentSpaceId } = useSpace();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 仅展示可执行任务的 Agent：绑定了工作电脑且有 runtime
  const bindableAgents = useMemo(
    () => agents.filter((a) => a.work_computer_id && a.runtime),
    [agents],
  );

  const handleOk = async () => {
    if (!currentSpaceId) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const prompt = (values.prompt as string).trim();
      const task = await createTask(currentSpaceId, {
        agent_id: values.agentId,
        title: prompt.slice(0, 40),
        prompt,
        priority: (values.priority ?? 'medium') as TaskPriority,
      });
      message.success('事项已创建并下发执行');
      onClose();
      form.resetFields();
      onCreated(task.id);
    } catch (e) {
      if (e instanceof Error) message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="新建事项"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="创建并下发"
      cancelText="取消"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="!pt-2">
        <Form.Item
          name="agentId"
          label="执行 Agent"
          rules={[{ required: true, message: '请选择 Agent' }]}
        >
          <Select
            placeholder="选择已绑定工作电脑的 Agent"
            options={bindableAgents.map((a) => ({
              value: a.id,
              label: (
                <span className="flex items-center gap-2">
                  <RobotOutlined className="text-standard" />
                  <span className="font-medium">{a.name}</span>
                  {a.runtime && <RuntimeBadge name={a.runtime} size={11} />}
                </span>
              ),
            }))}
          />
        </Form.Item>
        <Form.Item
          name="prompt"
          label="指令"
          rules={[{ required: true, message: '请输入要 Agent 执行的内容' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="描述要让 Agent 做的事，例如：分析当前目录下的 TODO 注释，按模块汇总并输出清单"
          />
        </Form.Item>
        <Form.Item name="priority" label="优先级" initialValue="medium">
          <Select
            options={[
              { value: 'high', label: '高' },
              { value: 'medium', label: '中' },
              { value: 'low', label: '低' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const AgentTasks = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { currentSpaceId } = useSpace();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const { data: tasks, run: reloadTasks } = useRequest(listTasks, [currentSpaceId]);
  const { data: agents } = useRequest(listAgents, [currentSpaceId]);

  // 任务状态事件驱动刷新（其他端创建/完成时自动更新）；输出事件不触发列表刷新
  useTaskEvents(currentSpaceId !== undefined, currentSpaceId, (e) => {
    if (e.type === 'task_updated') reloadTasks(currentSpaceId);
  });

  const agentMap = useMemo(() => new Map((agents ?? []).map((a) => [a.id, a])), [agents]);

  const countByStatus = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    (tasks ?? []).forEach((t) => {
      counts[t.status] += 1;
    });
    return counts;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return (tasks ?? []).filter((t) => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchSearch =
        !kw || t.title.toLowerCase().includes(kw) || (t.prompt ?? '').toLowerCase().includes(kw);
      return matchStatus && matchSearch;
    });
  }, [tasks, statusFilter, search]);

  const handleNew = () => {
    if (!currentSpaceId) {
      message.warning('请先创建工作空间');
      return;
    }
    setNewOpen(true);
  };

  return (
    <Page
      title="Agent 事项"
      subtitle="下发到工作电脑执行的 Agent 任务与实时输出"
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
            onChange={(v) => setStatusFilter(v as TaskStatus | 'all')}
            options={FILTER_OPTIONS.map((o) =>
              o.value === 'all'
                ? { label: `全部 ${tasks?.length ?? 0}`, value: 'all' }
                : {
                    label: (
                      <span className="flex items-center gap-1">
                        {o.label}
                        <span
                          className="flex size-4 items-center justify-center rounded-full text-[10px] font-medium"
                          style={{
                            background: `${STATUS_META[o.value as TaskStatus].color}14`,
                            color: STATUS_META[o.value as TaskStatus].color,
                          }}
                        >
                          {countByStatus[o.value as TaskStatus]}
                        </span>
                      </span>
                    ),
                    value: o.value,
                  },
            )}
          />
          <Input
            placeholder="搜索标题或指令..."
            prefix={<SearchOutlined />}
            className="!w-[260px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>

        <div className="flex flex-col gap-3">
          {filteredTasks.map((task) => {
            const status = STATUS_META[task.status];
            const priority = PRIORITY_META[task.priority];
            const agent = task.agent_id ? agentMap.get(task.agent_id) : undefined;
            return (
              <div
                key={task.id}
                onClick={() => navigate(`/space/tasks/${task.id}`)}
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
                  <p className="mt-1 truncate text-xs text-muted">{task.prompt ?? task.command}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <ThunderboltOutlined className="text-muted" />
                      <span className="font-medium">{SOURCE_LABEL[task.source]}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <RobotOutlined className="text-muted" />
                      <span className="font-medium">
                        {agent?.name ?? (task.runtime ? `Agent (${task.runtime})` : 'Agent')}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      {task.runtime && <RuntimeBadge name={task.runtime} size={11} />}
                    </span>
                    <span className="text-muted">{formatTime(task.created_at)}</span>
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
              {search || statusFilter !== 'all'
                ? '暂无匹配的事项'
                : '暂无事项，点击右上角「新建事项」下发第一个任务'}
            </div>
          )}
        </div>
      </div>

      <NewTaskModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        agents={agents ?? []}
        onCreated={(taskId) => {
          reloadTasks(currentSpaceId);
          navigate(`/space/tasks/${taskId}`);
        }}
      />
    </Page>
  );
};

export default AgentTasks;
