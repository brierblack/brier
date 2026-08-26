import { memo, type ReactNode } from 'react';

export interface PageProps {
  children: ReactNode;
  title?: ReactNode | string;
  subtitle?: ReactNode | string;
  extra?: ReactNode | string;
  header?: ReactNode;
}

export const Page = memo(({ children, title, subtitle, extra, header }: PageProps) => {
  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex min-h-12 shrink-0 items-center justify-between border-b border-ghost px-4">
        {header ? (
          <div className="flex items-center gap-1.5 text-standard">{header}</div>
        ) : (
          <div className="flex items-baseline gap-2">
            {title && (
              <h1 className="m-0 text-standard leading-tight font-bold tracking-tight">{title}</h1>
            )}
            {subtitle && <span className="text-xs">{subtitle}</span>}
          </div>
        )}
        {extra && <div>{extra}</div>}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
});
