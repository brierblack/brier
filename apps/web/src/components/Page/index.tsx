import { memo, type ReactNode } from 'react';

interface PageProps {
  children: ReactNode;
  title?: ReactNode | string;
  subtitle?: ReactNode | string;
  extra?: ReactNode | string;
  breadcrumb?: ReactNode;
}

export const Page = memo(({ children, title, subtitle, extra, breadcrumb }: PageProps) => {
  return (
    <div className="h-full flex flex-col bg-[#fbfbfb]">
      <div className="h-14 px-5 flex items-center justify-between border-b border-[#e9e9e9] shrink-0">
        {breadcrumb ? (
          <div className="flex items-center gap-1.5 text-sm">{breadcrumb}</div>
        ) : (
          <div className="flex items-baseline gap-2">
            {title && (
              <h1 className="m-0 font-bold tracking-tight text-sm text-ink leading-tight">
                {title}
              </h1>
            )}
            {subtitle && <span className="text-xs text-faint">{subtitle}</span>}
          </div>
        )}
        {extra && <div>{extra}</div>}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
});
