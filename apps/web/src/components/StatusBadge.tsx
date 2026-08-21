import type { ReactNode } from 'react';
import { Tag } from '@/components/Tag';
import {
  WifiOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { STATUS_MAP } from '../define';
import type { EntityStatus } from '../types';

const STATUS_ICON: Record<EntityStatus, ReactNode> = {
  online: <WifiOutlined />,
  connecting: <SyncOutlined spin />,
  offline: <DisconnectOutlined />,
  error: <ExclamationCircleOutlined />,
  available: <WifiOutlined />,
  unavailable: <DisconnectOutlined />,
};

interface StatusBadgeProps {
  status: EntityStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status];
  if (!config) return null;

  return (
    <Tag
      icon={STATUS_ICON[status]}
      style={{
        background: `${config.color}1a`,
        borderColor: `${config.color}33`,
        color: config.color,
      }}
    >
      {config.label}
    </Tag>
  );
}
