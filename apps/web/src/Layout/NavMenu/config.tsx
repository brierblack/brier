import {
  ControlOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  ScheduleOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { MenuProps } from '@brierb/brier-ui';

export const NAV_ITEMS: MenuProps['items'] = [
  {
    key: 'session',
    icon: <MessageOutlined />,
    className: 'flex! group',
    label: '新会话',
    extra: (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <kbd className="inline-flex items-center justify-center text-xs text-faint">⌘</kbd>
        <kbd className="inline-flex items-center justify-center text-xs text-faint">⇧</kbd>
        <kbd className="inline-flex items-center justify-center text-xs text-faint">O</kbd>
      </div>
    ),
  },
  { key: 'tasks', icon: <ScheduleOutlined />, label: 'Agent 事项', extra: <PlusOutlined /> },
  { key: 'automation', icon: <ControlOutlined />, label: '自动化' },
  { type: 'divider' },
  {
    key: 'agents',
    label: 'Agents',
    icon: <RobotOutlined />,
  },
  {
    key: 'team',
    label: 'Agent 团队',
    icon: <TeamOutlined />,
  },
  {
    key: 'skills',
    label: 'Skills',
    icon: <ThunderboltOutlined />,
  },
  {
    key: 'settings',
    label: '设置',
    icon: <SettingOutlined />,
  },
  { type: 'divider' },
];
