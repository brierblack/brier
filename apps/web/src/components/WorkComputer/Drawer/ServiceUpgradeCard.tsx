import { memo } from 'react';
import { Card, Tag } from '@brierb/brier-ui';
import { CheckCircleOutlined } from '@ant-design/icons';

interface ServiceUpgradeCardProps {
  /** 电脑上 brier daemon（后台服务）版本，由 CLI Auth 上报。 */
  version?: string | null;
}

export const ServiceUpgradeCard = memo(({ version }: ServiceUpgradeCardProps) => (
  <Card title="后台服务">
    <div className="flex items-center justify-between p-4">
      <div>
        <span className="text-xs">接入版本 </span>
        <span className="font-mono text-standard font-medium">{version ? `v${version}` : '—'}</span>
      </div>
      {version ? (
        <Tag
          icon={<CheckCircleOutlined />}
          className="!border-[#389e0d33] !bg-[#389e0d1a] !text-[#389e0d]"
        >
          已接入
        </Tag>
      ) : (
        <span className="text-xs text-muted">等待上报</span>
      )}
    </div>
  </Card>
));
