import { Avatar, Menu } from 'antd';
import type { PageKey } from '../types';
import { NAV_ITEMS } from '../define';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}

const sections = [...new Set(NAV_ITEMS.map((item) => item.section))];

const menuItems = sections.map((section) => ({
  type: 'group' as const,
  label: <span className="text-[10px] font-semibold tracking-[1.5px] uppercase text-faint">{section}</span>,
  children: NAV_ITEMS.filter((item) => item.section === section).map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  })),
}));

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="pt-5 px-5 pb-3 flex items-center gap-2.5 shrink-0">
        <div className="size-9 rounded-md bg-[linear-gradient(135deg,#fe6e00,#f05100)] flex items-center justify-center text-white font-extrabold text-lg shadow-[0_2px_8px_rgba(254,110,0,0.3)] shrink-0">
          H
        </div>
        <span className="text-[19px] font-bold text-ink tracking-tight whitespace-nowrap">Hive</span>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[activePage]}
        items={menuItems}
        onClick={(e) => onNavigate(e.key as PageKey)}
        style={{ flex: 1, borderInlineEnd: 'none', background: 'transparent', paddingInline: 10 }}
      />

      <div className="flex items-center gap-2.5 px-4 py-3 shrink-0">
        <Avatar
          size={32}
          className="shrink-0"
          style={{ borderRadius: 6, background: 'linear-gradient(135deg, #8d54ff, #7008e7)' }}
        >
          DY
        </Avatar>
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-ink">开发者</div>
          <div className="text-[11px] text-faint">admin@hive.dev</div>
        </div>
      </div>
    </div>
  );
}
