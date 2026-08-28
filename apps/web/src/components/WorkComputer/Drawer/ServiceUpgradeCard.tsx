import { memo } from 'react';
import { Button } from '@brierb/brier-ui';
import { ArrowUpOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Card, Tag } from '@brierb/brier-ui';

interface ServiceUpgradeCardProps {
  version?: string;
  latestVersion?: string;
  isLatest: boolean;
}

export const ServiceUpgradeCard = memo(
  ({ version, latestVersion, isLatest }: ServiceUpgradeCardProps) => (
    <Card title="后台服务升级">
      <div className="flex items-center justify-between p-4">
        <div>
          <span className="text-xs">当前版本 </span>
          <span className="font-mono text-standard font-medium">{version ?? '—'}</span>
        </div>
        {isLatest ? (
          <Tag
            icon={<CheckCircleOutlined />}
            style={{
              background: '#389e0d1a',
              borderColor: '#389e0d33',
              color: '#389e0d',
            }}
          >
            已是最新
          </Tag>
        ) : (
          <Button type="primary" size="small" icon={<ArrowUpOutlined />}>
            升级到 {latestVersion}
          </Button>
        )}
      </div>
    </Card>
  ),
);
