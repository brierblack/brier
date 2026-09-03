import { memo } from 'react';
import { Card, Tag } from '@brierb/brier-ui';
import { RuntimeIcon } from '../../RuntimeIcon';

interface RuntimeCardProps {
  runtimes: string[];
}

export const RuntimeCard = memo(({ runtimes }: RuntimeCardProps) => (
  <Card title="检测到的 Runtime">
    <div className="flex flex-wrap gap-2 p-4">
      {runtimes.length === 0 ? (
        <span className="text-xs text-muted">暂无运行时上报（电脑在线后自动检测）</span>
      ) : (
        runtimes.map((rt) => (
          <Tag key={rt} className="!cursor-pointer !border-ghost !bg-[#f0f0f0] !text-[#333]">
            <span className="inline-flex items-center gap-1.5">
              <RuntimeIcon name={rt} size={12} />
              {rt}
            </span>
          </Tag>
        ))
      )}
    </div>
  </Card>
));
