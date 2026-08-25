import type { ReactNode } from 'react';
import { Tag } from '@hiveblack/ui';
import { WifiOutlined, SyncOutlined, DisconnectOutlined } from '@ant-design/icons';
import { STATUS_MAP } from '../define';
import type { AgentStatus } from '../types';

const STATUS_ICON: Record<AgentStatus, ReactNode> = {
  online: <WifiOutlined />,
  connecting: <SyncOutlined spin />,
  offline: <DisconnectOutlined />,
};

interface StatusBadgeProps {
  status: AgentStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = STATUS_MAP[status];
  if (!config) return null;

  return (
    <Tag icon={STATUS_ICON[status]} className={config.color}>
      {config.label}
    </Tag>
  );
};
