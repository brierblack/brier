import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { TaskPriority, TaskSource, TaskStatus } from '@/api/generated';

/** 任务状态展示元数据（与后端 TaskStatus 对齐）。 */
export const STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending: { label: '待执行', color: '#fa8c16', bg: '#fa8c160f', icon: <ClockCircleOutlined /> },
  running: { label: '执行中', color: '#1677ff', bg: '#1677ff0f', icon: <SyncOutlined /> },
  completed: { label: '已完成', color: '#52c41a', bg: '#52c41a0f', icon: <CheckCircleOutlined /> },
  failed: { label: '失败', color: '#f5222d', bg: '#f5222d0f', icon: <CloseCircleOutlined /> },
  cancelled: { label: '已取消', color: '#8c8c8c', bg: '#8c8c8c0f', icon: <StopOutlined /> },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: '高优先级', color: '#f5222d' },
  medium: { label: '中优先级', color: '#fa8c16' },
  low: { label: '低优先级', color: '#8c8c8c' },
};

export const SOURCE_LABEL: Record<TaskSource, string> = {
  manual: '手动创建',
  automation: '自动化',
};

/** 是否仍在执行中（列表/详情轮询依据）。 */
export const isActiveStatus = (status: TaskStatus): boolean =>
  status === 'pending' || status === 'running';

/** 后端时间为 UTC ISO；渲染为本地可读时间（x 分钟前 / 今天 HH:mm / 日期）。 */
export const formatTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  if (diff >= 0 && diff < 60_000) return '刚刚';
  if (diff >= 0 && diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return `今天 ${hm}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `昨天 ${hm}`;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm}`;
};
