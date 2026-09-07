import { memo } from 'react';
import { Button, Card } from '@brierb/brier-ui';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface DangerZoneCardProps {
  deleting?: boolean;
  onDelete: () => void;
}

export const DangerZoneCard = memo(({ deleting, onDelete }: DangerZoneCardProps) => (
  <Card title="危险操作">
    <div className="flex items-center justify-between p-4">
      <div className="flex items-start gap-2">
        <ExclamationCircleOutlined className="mt-0.5 text-danger" />
        <div>
          <div className="text-standard font-medium">删除 Agent 工作电脑</div>
          <div className="mt-1 text-xs">
            删除后该电脑将无法接入平台；其上关联的 Agent 会自动解绑，需重新接入。
          </div>
        </div>
      </div>
      <Button danger icon={<DeleteOutlined />} loading={deleting} onClick={onDelete}>
        删除 Agent 工作电脑
      </Button>
    </div>
  </Card>
));
