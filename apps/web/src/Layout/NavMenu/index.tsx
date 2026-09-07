import { memo, useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { App } from 'antd';

import {
  MessageOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  EllipsisOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Menu } from '@brierb/brier-ui';
import { deleteSession, listSessions, type Session } from '@/api/generated';
import { useRequest } from '@/hooks/useRequest';
import { useSpace } from '@/context/SpaceContext';
import { Logo, Word } from '@/components/Logo';
import { SpaceSelect } from '@/components/SpaceSelect';
import { NAV_ITEMS } from './nav';
import { UserSetting } from '@/components/UserSetting';

export const NavMenu = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { currentSpaceId } = useSpace();
  const { message, modal } = App.useApp();
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [olderExpanded, setOlderExpanded] = useState(false);

  // 会话列表（当前空间；删除会话后手动 run() 重取）
  const { data: sessions, run: runSessionsList } = useRequest(listSessions, [currentSpaceId]);

  const handleDeleteSession = useCallback(
    (session: Session) => {
      modal.confirm({
        title: `删除会话「${session.title}」`,
        content: '删除后该会话及其消息将一并移除。',
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          try {
            await deleteSession(currentSpaceId, session.id);
            message.success('已删除');
            runSessionsList(currentSpaceId);
            if (location.pathname === `/space/session/${session.id}`) {
              navigate('/space/session');
            }
          } catch (e) {
            message.error(e instanceof Error ? e.message : '删除失败');
          }
        },
      });
    },
    [navigate, runSessionsList],
  );

  // 会话按最近 7 天 / 更早分组（以 updated_at 计）
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const sessionItems = (sessions ?? []).map((s) => ({
    session: s,
    recent: new Date(s.updated_at).getTime() >= weekAgo,
  }));
  const convItem = (s: Session) => ({
    key: s.id,
    icon: <MessageOutlined />,
    label: s.title,
    className: 'flex group',
    extra: (
      <div className="opacity-0 group-hover:opacity-100">
        <Dropdown
          menu={{
            items: [{ key: 'delete', label: '删除', icon: <DeleteOutlined /> }],
            onClick: () => handleDeleteSession(s),
          }}
          trigger={['click']}
        >
          <Button
            size="small"
            bordered={false}
            icon={<EllipsisOutlined />}
            onClick={(e) => e.stopPropagation()}
            classNames={{ root: 'hover:bg-ghost! rounded-full!' }}
          />
        </Dropdown>
      </div>
    ),
  });

  const recentItems = sessionItems.filter((i) => i.recent).map((i) => convItem(i.session));
  const olderItems = sessionItems.filter((i) => !i.recent).map((i) => convItem(i.session));
  const hasSessions = (sessions?.length ?? 0) > 0;

  const selectedMenuKeys = useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith('/space/session/')) return [];
    if (pathname.startsWith('/space/')) {
      const paths = pathname.split('/');
      return paths[2] ? [paths[2]] : [];
    }
    return [];
  }, [location.pathname]);

  const selectedSessionKeys = useMemo(() => {
    if (location.pathname.startsWith('/space/session/')) {
      return params.id ? [params.id] : [];
    }
    return [];
  }, [location.pathname, params.id]);

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
        {!hasSessions && (
          <div className="px-2 py-2 text-xs text-muted">暂无会话，点击上方「新会话」开始</div>
        )}
        <div
          className="group flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-standard font-medium hover:bg-[#f5f5f5]"
          onClick={() => setRecentExpanded(!recentExpanded)}
        >
          最近 7 天
          <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
            {recentExpanded ? (
              <CaretDownOutlined className="text-[10px]" />
            ) : (
              <CaretRightOutlined className="text-[10px]" />
            )}
          </span>
        </div>
        {recentExpanded && (
          <Menu
            mode="vertical"
            selectedKeys={selectedSessionKeys}
            items={recentItems}
            onClick={({ key }) => navigate(`/space/session/${key}`)}
          />
        )}

        <div
          className="group flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-standard font-medium hover:bg-[#f5f5f5]"
          onClick={() => setOlderExpanded(!olderExpanded)}
        >
          更早
          <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
            {olderExpanded ? (
              <CaretDownOutlined className="text-[10px]" />
            ) : (
              <CaretRightOutlined className="text-[10px]" />
            )}
          </span>
        </div>
        {olderExpanded && (
          <Menu
            mode="vertical"
            selectedKeys={selectedSessionKeys}
            items={olderItems}
            onClick={({ key }) => navigate(`/space/session/${key}`)}
          />
        )}
      </div>

      <div className="pt-3">
        <UserSetting />
      </div>
    </div>
  );
});
