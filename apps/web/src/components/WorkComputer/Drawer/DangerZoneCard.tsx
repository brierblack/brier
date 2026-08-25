import { memo } from 'react';
import { Button } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Card } from '@hiveblack/ui';

interface DangerZoneCardProps {
  agentCount: number;
  onDelete: () => void;
}

export const DangerZoneCard = memo(({ agentCount, onDelete }: DangerZoneCardProps) => (
  <Card title="危险操作">
    <div className="flex items-center justify-between p-4">
      <div className="flex items-start gap-2">
        <ExclamationCircleOutlined className="mt-0.5 text-danger" />
        <div>
          <div className="text-standard font-medium">删除 Agent 工作电脑</div>
          <div className="mt-1 text-xs text-muted">
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
