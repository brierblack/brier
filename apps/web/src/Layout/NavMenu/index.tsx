import { memo, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu } from '@brierb/brier-ui';
import { Logo, Word } from '@/components/Logo';
import { SpaceSelect } from '@/components/SpaceSelect';
import { UserSetting } from '@/components/UserSetting';
import { NAV_ITEMS } from './config';
import { SessionList } from './SessionList';

export const NavMenu = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedMenuKeys = useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith('/space/session/')) return [];
    if (pathname.startsWith('/space/')) {
      const paths = pathname.split('/');
      return paths[2] ? [paths[2]] : [];
    }
    return [];
  }, [location.pathname]);

  return (
    <div className="flex h-full flex-col pr-2">
      <div className="flex shrink-0 items-center gap-2 p-1">
        <Logo size={24} variant="white" />
        <Word className="text-[20px] tracking-tight whitespace-nowrap" />
      </div>

      <div className="shrink-0 px-1 py-2">
        <SpaceSelect />
      </div>

      <div className="shrink-0 px-1">
        <Menu
          mode="vertical"
          selectedKeys={selectedMenuKeys}
          items={NAV_ITEMS}
          onClick={(e) => {
            navigate(`/space/${e.key}`);
          }}
        />
      </div>

      <div className="flex-1 scrollbar-none overflow-y-auto [mask-image:linear-gradient(to_top,transparent,black_25%)] px-1 [-webkit-mask-image:linear-gradient(to_top,transparent,black_25%)]">
        <SessionList />
      </div>

      <div className="pt-3">
        <UserSetting />
      </div>
    </div>
  );
});
