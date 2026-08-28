import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App, Input } from 'antd';
import { Button, Page, Tag } from '@brierb/brier-ui';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  FlagOutlined,
  MessageOutlined,
  PlusOutlined,
  SendOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  MOCK_ACTIVITIES,
  PRIORITY_MAP,
  STATUS_MAP,
  TASK_AGENTS,
  getTaskAgent,
  getTaskById,
  type TaskActivity,
  type TaskActivityType,
  type TaskAgent,
} from '../data';

const ACTIVITY_META: Record<
  TaskActivityType,
  { text: string; icon: React.ReactNode; color: string }
> = {
  created: { text: '创建了事项', icon: <PlusOutlined />, color: '#1677ff' },
  assigned: { text: '将事项分配给', icon: <SendOutlined />, color: '#722ed1' },
  accepted: { text: '接受了任务', icon: <CheckOutlined />, color: '#fa8c16' },
  comment: { text: '评论', icon: <MessageOutlined />, color: '#8c8c8c' },
  completed: { text: '完成了事项', icon: <FlagOutlined />, color: '#52c41a' },
};

const AgentBadge = ({ agent, size = 24 }: { agent: TaskAgent; size?: number }) => (
  <div
    className="flex shrink-0 items-center justify-center rounded-full"
    style={{
      width: size,
      height: size,
      backgroundColor: agent.color + '1a',
      border: `1px solid ${agent.color}22`,
      fontSize: size * 0.5,
    }}
  >
    {agent.icon}
  </div>
);

const ActivityItem = ({ activity, isLast }: { activity: TaskActivity; isLast: boolean }) => {
  const agent = getTaskAgent(activity.agentId);
  const targetAgent = activity.targetAgentId ? getTaskAgent(activity.targetAgentId) : undefined;
  const meta = ACTIVITY_META[activity.type];

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="relative">
          <AgentBadge agent={agent} />
          <span
            className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-white text-[9px] shadow-sm"
            style={{ color: meta.color }}
          >
            {meta.icon}
          </span>
        </div>
        {!isLast && <div className="my-1 w-px flex-1 bg-ghost" />}
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
          <span className="text-standard font-medium">{agent.name}</span>
          <span className="text-standard">{meta.text}</span>
          {targetAgent && (
            <span className="flex items-center gap-1">
              <AgentBadge agent={targetAgent} size={16} />
              <span className="font-medium text-brand">{targetAgent.name}</span>
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted">{activity.time}</div>
        {activity.content && (
          <div className="mt-2 rounded-lg bg-[#f5f5f5] px-3 py-2.5 text-sm leading-relaxed">
            {activity.content}
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityTimeline = ({
  activities,
  onAddActivity,
  disabled,
}: {
  activities: TaskActivity[];
  onAddActivity: (activity: TaskActivity) => void;
  disabled: boolean;
}) => {
  const [comment, setComment] = useState('');

  const handleComment = () => {
    const text = comment.trim();
    if (!text) return;
    onAddActivity({
      id: `comment-${Date.now()}`,
      type: 'comment',
      agentId: 1,
      content: text,
      time: '刚刚',
    });
    setComment('');
  };

  return (
    <div className="rounded-xl border border-ghost bg-white p-5">
      <div className="mb-4 text-standard font-bold">动态</div>
      <div>
        {activities.map((activity, index) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            isLast={index === activities.length - 1}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8d54ff] to-[#7008e7] text-xs font-medium text-white">
          RJ
        </span>
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onPressEnter={handleComment}
          placeholder="写下评论，与 Agent 互动..."
          disabled={disabled}
          suffix={
            <Button
              type="primary"
              size="small"
              shape="circle"
              icon={<SendOutlined />}
              onClick={handleComment}
              disabled={!comment.trim() || disabled}
            />
          }
        />
      </div>
    </div>
  );
};

const DetailInfoItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-xs text-muted">{label}</div>
    <div className="mt-1 text-sm text-standard font-medium">{children}</div>
  </div>
);

const AgentTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const task = getTaskById(id ?? '');
  const [status, setStatus] = useState(task?.status ?? 'pending');
  const [activities, setActivities] = useState<TaskActivity[]>(
    task ? (MOCK_ACTIVITIES[task.id] ?? []) : [],
  );

  if (!task) {
    return (
      <Page header={<span>事项未找到</span>}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-standard">未找到该事项</p>
            <Button onClick={() => navigate('/space/agent-tasks')}>返回列表</Button>
          </div>
        </div>
      </Page>
    );
  }

  const statusMeta = STATUS_MAP[status];
  const priority = PRIORITY_MAP[task.priority];
  const ownerAgent = TASK_AGENTS.find((a) => a.name === task.agentName);

  const handleAccept = () => {
    setStatus('processing');
    setActivities((prev) => [
      ...prev,
      { id: `accept-${Date.now()}`, type: 'accepted', agentId: ownerAgent?.id ?? 4, time: '刚刚' },
    ]);
    message.success('已接受任务');
  };

  const handleComplete = () => {
    setStatus('completed');
    setActivities((prev) => [
      ...prev,
      { id: `done-${Date.now()}`, type: 'completed', agentId: ownerAgent?.id ?? 4, time: '刚刚' },
    ]);
    message.success('事项已完成');
  };

  const handleAddActivity = (activity: TaskActivity) => {
    setActivities((prev) => [...prev, activity]);
  };

  const showActions = status !== 'completed';

  return (
    <Page
      header={
        <div className="flex items-center gap-3 py-2.5">
          <Button
            bordered={false}
            icon={
              <ArrowLeftOutlined
                className="shrink-0 cursor-pointer text-standard hover:text-brand"
                onClick={() => navigate('/space/agent-tasks')}
              />
            }
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="m-0 truncate text-lg font-bold">{task.title}</h1>
              <Tag color={statusMeta.color} className="m-0">
                {statusMeta.label}
              </Tag>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {task.sourceName} · 创建于 {task.createdAt}
            </p>
          </div>
        </div>
      }
      extra={
        <div className="flex items-center gap-2">
          {status === 'pending' && (
            <Button type="primary" icon={<CheckOutlined />} onClick={handleAccept}>
              接受任务
            </Button>
          )}
          {status === 'processing' && (
            <Button type="primary" icon={<FlagOutlined />} onClick={handleComplete}>
              标记完成
            </Button>
          )}
          {!showActions && (
            <Button
              onClick={() => {
                setStatus('pending');
                message.success('事项已重新打开');
              }}
            >
              重新打开
            </Button>
          )}
          <Button danger onClick={() => message.info('删除功能开发中')}>
            删除
          </Button>
        </div>
      }
    >
      <div className="p-4">
        <div className="mb-6 rounded-xl border border-ghost bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <span
              className="flex size-8 items-center justify-center rounded-lg text-base"
              style={{
                background: `${statusMeta.color}0d`,
                border: `1px solid ${statusMeta.color}22`,
                color: statusMeta.color,
              }}
            >
              {statusMeta.icon}
            </span>
            <div>
              <div className="text-standard font-medium">事项详情</div>
              <div className="text-xs text-muted">#{task.id.toUpperCase()}</div>
            </div>
          </div>

          <p className="text-sm text-standard leading-relaxed">{task.desc}</p>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ghost pt-4 sm:grid-cols-3">
            <DetailInfoItem label="状态">
              <span style={{ color: statusMeta.color }}>{statusMeta.label}</span>
            </DetailInfoItem>
            <DetailInfoItem label="优先级">
              <Tag color={priority.color} className="m-0">
                {priority.label}
              </Tag>
            </DetailInfoItem>
            <DetailInfoItem label="来源">
              <span className="flex items-center gap-1">
                <ThunderboltOutlined className="text-muted" />
                {task.sourceName}
              </span>
            </DetailInfoItem>
            <DetailInfoItem label="负责 Agent">
              <span className="flex items-center gap-1.5">
                {ownerAgent ? <AgentBadge agent={ownerAgent} size={20} /> : <RobotOutlined />}
                {task.agentName}
              </span>
            </DetailInfoItem>
            <DetailInfoItem label="创建时间">
              <span className="flex items-center gap-1">
                <ClockCircleOutlined className="text-muted" />
                {task.createdAt}
              </span>
            </DetailInfoItem>
            <DetailInfoItem label="当前动态">
              <span className="text-muted">{activities.length} 条</span>
            </DetailInfoItem>
          </div>
        </div>

        <ActivityTimeline
          activities={activities}
          onAddActivity={handleAddActivity}
          disabled={status === 'completed'}
        />
      </div>
    </Page>
  );
};

export default AgentTaskDetail;
