import { memo } from 'react';
import { Card, Tag } from '@brierb/ui';
import { RuntimeIcon } from '../../RuntimeIcon';

interface RuntimeCardProps {
  runtimes: string[];
}

export const RuntimeCard = memo(({ runtimes }: RuntimeCardProps) => (
  <Card title="检测到的 Runtime">
    <div className="flex flex-wrap gap-2 p-4">
      {runtimes.map((rt) => (
        <Tag
          key={rt}
          style={{
            background: '#f0f0f0',
            borderColor: 'var(--color-ghost)',
            color: '#333',
            cursor: 'pointer',
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <RuntimeIcon name={rt} size={12} />
            {rt}
          </span>
        </Tag>
      ))}
    </div>
  </Card>
));
