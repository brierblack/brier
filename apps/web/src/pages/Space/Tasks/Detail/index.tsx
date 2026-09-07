import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App } from 'antd';
import { Button, Page, Tag } from '@brierb/brier-ui';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  RobotOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { cancelTask, getTask, listAgents } from '@/api/generated';
import type { AgentTask } from '@/api/generated';
import { useRequest } from '@/hooks/useRequest';
import { useTaskEvents } from '@/hooks/useTaskEvents';
import { useSpace } from '@/context/SpaceContext';
import { RuntimeBadge } from '../../../../components/RuntimeIcon';
import { formatTime, isActiveStatus, PRIORITY_META, SOURCE_LABEL, STATUS_META } from '../data';

const DetailInfoItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="text-xs text-muted">{label}</div>
    <div className="mt-1 flex items-center gap-1.5 text-sm text-standard font-medium">
      {children}
    </div>
  </div>
);

const AgentTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { currentSpaceId } = useSpace();
  const outputRef = useRef<HTMLPreElement>(null);

  // 快照：初载与终态校准走一次全量 GET；执行中的增量由 SSE 推送实时追加
  const { data: fetched, run: reloadTask } = useRequest(getTask, [currentSpaceId, id]);
  const [task, setTask] = useState<AgentTask | undefined>(undefined);
  useEffect(() => {
    if (fetched) setTask(fetched);
  }, [fetched]);

  // 已确认渲染的输出长度：SSE 增量按 offset 对齐追加，避免与快照重复/丢失
  const outputLenRef = useRef(0);
  useEffect(() => {
    outputLenRef.current = task?.output.length ?? 0;
  }, [task]);

  const { data: agents } = useRequest(listAgents, [currentSpaceId]);
  const agent = useMemo(
    () => (task ? (agents ?? []).find((a) => a.id === task.agent_id) : undefined),
    [agents, task],
  );

  const active = !!task && isActiveStatus(task.status);

  // SSE 实时订阅：task_output 增量追加；task_updated 终态触发一次全量校准
  useTaskEvents(currentSpaceId !== undefined && active, currentSpaceId, (e) => {
    if (e.task_id !== id) return;
    if (e.type === 'task_output') {
      if (e.offset === outputLenRef.current) {
        // 顺序增量：直接追加
        setTask((prev) => (prev ? { ...prev, output: prev.output + e.data } : prev));
      } else if (e.offset > outputLenRef.current) {
        // 中间缺块（断线重连丢帧等）：触发一次全量校准
        reloadTask(currentSpaceId, id);
      }
      // offset < 已渲染长度：快照已包含该块，跳过避免重复
    } else if (!isActiveStatus(e.status)) {
      // 终态：拉一次权威全量（含 exit_code / error / 完整 output）
      reloadTask(currentSpaceId, id);
    }
  });

  // 输出自动滚动到底部
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [task?.output]);

  if (!task) {
    return (
      <Page header={<span>事项未找到</span>}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="mb-3 text-standard">未找到该事项或加载中</p>
            <Button onClick={() => navigate('/space/tasks')}>返回列表</Button>
          </div>
        </div>
      </Page>
    );
  }

  const statusMeta = STATUS_META[task.status];
  const priority = PRIORITY_META[task.priority];

  const handleCancel = () => {
    if (!currentSpaceId) return;
    modal.confirm({
      title: '取消任务',
      content: '确定取消该任务吗？正在执行的进程会被终止。',
      okText: '取消任务',
      okButtonProps: { danger: true },
      cancelText: '再想想',
      onOk: async () => {
        try {
          await cancelTask(currentSpaceId, task.id);
          message.success('任务已取消');
          reloadTask(currentSpaceId, id);
        } catch (e) {
          message.error(e instanceof Error ? e.message : '取消失败');
        }
      },
    });
  };

  return (
    <Page
      header={
        <div className="flex items-center gap-3 py-2.5">
          <Button bordered={false} onClick={() => navigate('/space/tasks')}>
            <ArrowLeftOutlined className="shrink-0 cursor-pointer text-standard hover:text-brand" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="m-0 truncate text-lg font-bold">{task.title}</h1>
              <Tag color={statusMeta.color} className="m-0">
                {statusMeta.label}
              </Tag>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {SOURCE_LABEL[task.source]} · {formatTime(task.created_at)}
            </p>
          </div>
        </div>
      }
      extra={
        <div className="flex items-center gap-2">
          {active && (
            <Button danger icon={<StopOutlined />} onClick={handleCancel}>
              取消任务
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        {/* 任务信息 */}
        <div className="rounded-xl border border-ghost bg-white p-5">
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
              <div className="text-standard font-medium">任务详情</div>
              <div className="text-xs text-muted">#{task.id.slice(0, 8)}</div>
            </div>
          </div>

          <div className="mb-4 rounded-lg bg-[#fafafa] px-4 py-3 font-mono text-sm text-standard leading-relaxed whitespace-pre-wrap">
            {task.prompt ?? task.command ?? '（无指令）'}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-ghost pt-4 sm:grid-cols-4">
            <DetailInfoItem label="执行 Agent">
              <RobotOutlined className="text-muted" />
              <span className="truncate">
                {agent?.name ?? (task.runtime ? `Agent (${task.runtime})` : `Agent`)}
              </span>
            </DetailInfoItem>
            <DetailInfoItem label="Runtime">
              {task.runtime ? <RuntimeBadge name={task.runtime} size={14} /> : <span>—</span>}
            </DetailInfoItem>
            <DetailInfoItem label="优先级">
              <Tag color={priority.color} className="m-0">
                {priority.label}
              </Tag>
            </DetailInfoItem>
            <DetailInfoItem label="状态">
              <span style={{ color: statusMeta.color }}>{statusMeta.label}</span>
            </DetailInfoItem>
            <DetailInfoItem label="开始时间">
              <ClockCircleOutlined className="text-muted" />
              {formatTime(task.started_at)}
            </DetailInfoItem>
            <DetailInfoItem label="结束时间">
              <ClockCircleOutlined className="text-muted" />
              {formatTime(task.finished_at)}
            </DetailInfoItem>
            <DetailInfoItem label="退出码">
              <CodeOutlined className="text-muted" />
              {task.exit_code !== null && task.exit_code !== undefined ? task.exit_code : '—'}
            </DetailInfoItem>
          </div>

          {task.error && (
            <div className="mt-4 rounded-lg border border-[#f5222d33] bg-[#fff2f0] px-4 py-3 text-xs whitespace-pre-wrap text-[#cf1322]">
              {task.error}
            </div>
          )}
        </div>

        {/* 执行输出 */}
        <div className="overflow-hidden rounded-xl border border-ghost bg-[#0d1117]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="flex items-center gap-2 text-xs text-[#8b949e]">
              <CodeOutlined />
              执行输出
              {active && (
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#52c41a]" />
                  {task.status === 'pending' ? '等待执行' : '运行中'}
                </span>
              )}
            </span>
            {task.status === 'completed' && (
              <span className="text-xs text-[#52c41a]">exit {task.exit_code ?? 0}</span>
            )}
          </div>
          <pre
            ref={outputRef}
            className="m-0 h-[420px] overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[#c9d1d9]"
          >
            {task.output || (active ? '等待任务输出…' : '（无输出）')}
          </pre>
        </div>
      </div>
    </Page>
  );
};

export default AgentTaskDetail;
