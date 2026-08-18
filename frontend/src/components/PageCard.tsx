import { type ReactNode } from 'react';
import { Card } from 'antd';

interface PageCardProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  children: ReactNode;
}

export function PageCard({ title, subtitle, extra, children }: PageCardProps) {
  return (
    <Card
      className="m-5"
      style={
        {
          //borderRadius: 8,
          //border: '1px solid var(--color-line)',
          //boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.04)',
        }
      }
      styles={{ body: { padding: 28 } }}
    >
      <div className="flex items-end justify-between pb-5 mb-6 border-b border-line">
        <div>
          <h3 className="m-0 flex items-center gap-2.5 text-[26px] font-bold tracking-tight text-ink leading-tight">
            <span className="inline-block w-1 h-[22px] bg-brand rounded-sm shrink-0" />
            {title}
          </h3>
          {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
        </div>
        {extra}
      </div>
      {children}
    </Card>
  );
}
