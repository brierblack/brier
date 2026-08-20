import { Avatar, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../../define';
import { Logo, Wordmark } from '../../components/Logo';
import { WorkSpace } from '../../components/WorkSpace';

const menuItems = NAV_ITEMS.map((item) => ({
  key: item.key,
  icon: item.icon,
  label: item.label,
}));

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = location.pathname.slice(1);

  return (
    <div className="h-full flex flex-col pr-2">
      <div className=" px-1 flex items-center gap-1 shrink-0">
        <Logo className="w-14 h-10 shrink-0" />
        <Wordmark className="text-[20px] tracking-tight whitespace-nowrap" />
      </div>

      <div className="px-1 py-2 shrink-0">
        <WorkSpace />
      </div>

      <div className=" px-1 flex-1">
        <Menu
          mode="vertical"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={(e) => navigate(`/${e.key}`)}
          classNames={{
            root: ' !border-none !grid !gap-1 !bg-transparent',
            item: ' !px-2 !m-0 !h-8 !leading-8 !text-sm !w-full',
          }}
        />
      </div>

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
