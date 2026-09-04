import { useEffect, useRef, useState } from 'react';
import { App, Avatar } from 'antd';
import { Button, Dropdown, Select, Menu, type MenuProps } from '@brierb/brier-ui';

import {
  GithubOutlined,
  MessageOutlined,
  ControlOutlined,
  ScheduleOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  GlobalOutlined,
  BgColorsOutlined,
  BellOutlined,
  GithubFilled,
  PlusOutlined,
  LogoutOutlined,
  EllipsisOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '@/define';
import { Logo, Wordmark } from '@/components/Logo';
import { WorkSpace } from '../WorkSpace';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { deleteSession, listSessions } from '@/api/generated';
import type { Session } from '@/api/generated';
import { useApi } from '@/hooks/useApi';

const menuItems: MenuProps['items'] = [
  {
    key: 'new-chat',
    icon: <MessageOutlined />,
    className: 'flex! group',
    label: '新会话',
    extra: (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <kbd className="inline-flex items-center justify-center text-xs text-faint">⌘</kbd>
        <kbd className="inline-flex items-center justify-center text-xs text-faint">⇧</kbd>
        <kbd className="inline-flex items-center justify-center text-xs text-faint">O</kbd>
      </div>
    ),
  },
  { key: 'agent-tasks', icon: <ScheduleOutlined />, label: 'Agent 事项', extra: <PlusOutlined /> },
  { key: 'automation', icon: <ControlOutlined />, label: '自动化' },
  { type: 'divider' },
  ...NAV_ITEMS.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  })),
  { type: 'divider' },
];

export const NavMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout } = useAuth();
  const { currentWsId } = useWorkspace();
  const { message, modal } = App.useApp();
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [olderExpanded, setOlderExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setShowShadow] = useState(false);

  // 会话列表（当前空间；路由变化时回到列表可触发重取）
  const [tick, setTick] = useState(0);
  const { data: sessions } = useApi(
    () => (currentWsId ? listSessions(currentWsId) : Promise.resolve([])),
    [currentWsId, location.pathname, tick],
  );

  const handleDeleteSession = (s: Session) => {
    if (!currentWsId) return;
    modal.confirm({
      title: `删除会话「${s.title}」`,
      content: '删除后该会话及其消息将一并移除。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteSession(currentWsId, s.id);
          message.success('已删除');
          setTick((t) => t + 1);
          if (location.pathname === `/space/session/${s.id}`) navigate('/space/session');
        } catch (e) {
          message.error(e instanceof Error ? e.message : '删除失败');
        }
      },
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      const hasOverflow = el.scrollHeight > el.clientHeight;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      setShowShadow(hasOverflow && !isAtBottom);
    };

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });

    return () => el.removeEventListener('scroll', checkScroll);
  }, [recentExpanded, olderExpanded]);

  const selectedKey =
    location.pathname === '/space/session' || location.pathname.startsWith('/space/session/')
      ? 'new-chat'
      : location.pathname.replace('/space/', '').split('/')[0];

  const userOptions = [
    {
      value: 'language',
      label: (
        <div className="flex items-center gap-2">
          <GlobalOutlined />
          <span>语言</span>
        </div>
      ),
      children: [
        {
          value: 'en',
          label: 'English',
        },
        {
          value: 'zh',
          label: '中文 (简体)',
        },
        {
          value: 'ja',
          label: '日本語',
        },
      ],
    },
    {
      value: 'theme',
      label: (
        <div className="flex items-center gap-2">
          <BgColorsOutlined />
          <span>主题</span>
        </div>
      ),
      children: [
        {
          value: 'light',
          label: '浅色',
        },
        {
          value: 'dark',
          label: '深色',
        },
      ],
    },
    {
      value: 'message',
      label: (
        <div className="flex items-center gap-2">
          <BellOutlined />
          <span>消息</span>
        </div>
      ),
    },
  ];

  // 会话按最近 7 天 / 更早分组（以 updated_at 计）
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const sessionItems = (sessions ?? []).map((s) => ({
    session: s,
    recent: new Date(s.updated_at).getTime() >= weekAgo,
  }));
  const convItem = (s: Session) => ({
    key: `conv-${s.id}`,
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

  return (
    <div className="flex h-full flex-col pr-2">
      <div className="flex shrink-0 items-center gap-2 px-1">
        <Logo className="h-8 w-8 shrink-0" variant="white" />
        <Wordmark className="text-[20px] tracking-tight whitespace-nowrap" />
      </div>

      <div className="shrink-0 px-1 py-2">
        <WorkSpace />
      </div>

      <div className="shrink-0 px-1">
        <Menu
          mode="vertical"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={(e) => {
            if (e.key === 'new-chat') {
              navigate('/space/session');
              return;
            }
            navigate(`/space/${e.key}`);
          }}
        />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 scrollbar-none overflow-y-auto [mask-image:linear-gradient(to_top,transparent,black_25%)] px-1 [-webkit-mask-image:linear-gradient(to_top,transparent,black_25%)]"
      >
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
            selectedKeys={[]}
            items={recentItems}
            onClick={({ key }) => navigate(`/space/session/${key.replace('conv-', '')}`)}
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
            selectedKeys={[]}
            items={olderItems}
            onClick={({ key }) => navigate(`/space/session/${key.replace('conv-', '')}`)}
          />
        )}
      </div>

      <div className="pt-3">
        {!user && (
          <Button block onClick={() => login('github')} className="flex items-center gap-2">
            <GithubOutlined />
            GitHub 登录
          </Button>
        )}
        {user && (
          <Select
            defaultValue="language"
            placement="topLeft"
            button={{ block: true, bordered: false, className: 'py-2.5! px-2!', size: 'large' }}
            labelRender={() => (
              <div className="flex w-full items-center gap-2.5">
                {user.avatar_url ? (
                  <Avatar size={26} src={user.avatar_url} className="shrink-0 !rounded-[6px]" />
                ) : (
                  <Avatar
                    size={26}
                    className="shrink-0 !rounded-[6px] !bg-[linear-gradient(135deg,#0a0a0a,#3a3a3a)]"
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </Avatar>
                )}
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium">{user.username}</div>
                </div>
                <GithubFilled className="text-[16px]" />
              </div>
            )}
            options={userOptions}
            onChange={(value) => {
              if (value === 'message') navigate('/space/message');
            }}
            footer={
              <Button
                className="flex! justify-start! gap-2! p-3!"
                block
                bordered={false}
                onClick={logout}
              >
                <LogoutOutlined className="text-standard" />
                退出登录
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};
