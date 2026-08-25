import { memo } from 'react';
import { Tag } from '@/components/Tag';
import { Card } from '@/components/Card';

interface RuntimeCardProps {
  runtimes: string[];
}

export const RuntimeCard = memo(({ runtimes }: RuntimeCardProps) => (
  <Card title="检测到的 Runtime">
    <div className="p-4 flex flex-wrap gap-2">
      {runtimes.map((rt) => (
        <Tag
          key={rt}
          style={{
            background: '#f0f0f0',
            borderColor: 'var(--color-line)',
            color: '#333',
            cursor: 'pointer',
          }}
        >
          {rt}
        </Tag>
      ))}
    </div>
  </Card>
));
