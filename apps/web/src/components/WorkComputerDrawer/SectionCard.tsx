import { type ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'danger';
}

export function SectionCard({ title, extra, children, variant = 'default' }: SectionCardProps) {
  const isDanger = variant === 'danger';
  return (
    <div
      className={`border rounded-lg overflow-hidden ${
        isDanger ? 'border-[#ffccc7]' : 'border-[#e2e2e2]'
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b ${
          isDanger ? 'border-[#ffccc7] bg-[#fff1f0]' : 'border-[#e2e2e2] bg-[#fafafa]'
        }`}
      >
        <span className={`text-sm font-medium ${isDanger ? 'text-danger' : 'text-ink'}`}>
          {title}
        </span>
        {extra && <div>{extra}</div>}
      </div>
      <div className={`p-4 ${isDanger ? 'bg-[#fff2f0]' : ''}`}>{children}</div>
    </div>
  );
}
