import { memo } from 'react';
import { Button } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Card } from '@/components/Card';

interface DangerZoneCardProps {
  agentCount: number;
  onDelete: () => void;
}

export const DangerZoneCard = memo(({ agentCount, onDelete }: DangerZoneCardProps) => (
  <Card title="危险操作">
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-start gap-2">
        <ExclamationCircleOutlined className="text-danger mt-0.5" />
        <div>
          <div className="text-sm font-medium">删除 Agent 工作电脑</div>
          <div className="text-xs text-muted mt-1">
            该 Agent 工作电脑上还有 {agentCount} 个 Agent，请先归档所有 Agent 再删除。
          </div>
        </div>
      </div>
      <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
        删除 Agent 工作电脑
      </Button>
    </div>
  </Card>
));
