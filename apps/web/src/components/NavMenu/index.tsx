import { useEffect, useRef, useState } from 'react';
import { Avatar, Menu, type MenuProps } from 'antd';
import { Button, Dropdown, Select } from '@brierb/brier-ui';

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
  EditOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '@/define';
import { Logo, Wordmark } from '@/components/Logo';
import { WorkSpace } from '../WorkSpace';
import { useAuth } from '@/auth-context';
import { recentConversations, olderConversations } from '../../pages/Space/Chat/conversations';

const menuClassNames = {
  root: ' !border-none !grid !gap-1 !bg-transparent',
  item: ' !px-2 !m-0 !h-8 !leading-8 !text-standard !w-full',
};

const menuItems: MenuProps['items'] = [
  {
    key: 'new-chat',
    icon: <MessageOutlined />,
    className: 'flex! group',
    label: '新会话',
    extra: (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <kbd className="inline-flex items-center justify-center font-sans text-xs text-faint">
          ⌘
        </kbd>
        <kbd className="inline-flex items-center justify-center font-sans text-xs text-faint">
          ⇧
        </kbd>
        <kbd className="inline-flex items-center justify-center font-sans text-xs text-faint">
          O
        </kbd>
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
  const { user, loading, login, logout } = useAuth();
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [olderExpanded, setOlderExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setShowShadow] = useState(false);

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
    location.pathname === '/space/chat' || location.pathname.startsWith('/space/chat/')
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

  const recentItems: MenuProps['items'] = recentConversations.map((conv) => ({
    key: `conv-${conv.id}`,
    icon: <MessageOutlined />,
    label: conv.title,
    className: 'flex group',
    extra: (
      <div className="opacity-0 group-hover:opacity-100">
        <Dropdown
          menu={{
            items: [
              { key: 'view', label: '重命名', icon: <EditOutlined /> },
              { key: 'delete', label: '删除', icon: <DeleteOutlined /> },
            ],
            onClick: ({ key }) => {
              if (key === 'view') navigate(`/space/chat/${conv.id}`);
            },
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
  }));

  const olderItems: MenuProps['items'] = olderConversations.map((conv) => ({
    key: `conv-${conv.id}`,
    icon: <MessageOutlined />,
    label: conv.title,
  }));

  return (
    <div className="flex h-full flex-col pr-2">
      <div className="flex shrink-0 items-center gap-1 px-1">
        <Logo className="h-10 w-14 shrink-0" />
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
              navigate('/space/chat');
              return;
            }
            navigate(`/space/${e.key}`);
          }}
          classNames={menuClassNames}
        />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 scrollbar-none overflow-y-auto [mask-image:linear-gradient(to_top,transparent,black_25%)] px-1 [-webkit-mask-image:linear-gradient(to_top,transparent,black_25%)]"
      >
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
            onClick={({ key }) => navigate(`/space/chat/${key.replace('conv-', '')}`)}
            classNames={menuClassNames}
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
            onClick={({ key }) => navigate(`/space/chat/${key.replace('conv-', '')}`)}
            classNames={menuClassNames}
          />
        )}
      </div>

      <div className="pt-3">
        {loading && (
          <div className="flex items-center gap-2.5">
            <Avatar
              size={32}
              className="shrink-0"
              style={{ borderRadius: 6, background: '#e0e0e0' }}
            />
            <div className="m-1 min-w-0">
              <div className="text-[13px] font-medium">加载中...</div>
            </div>
          </div>
        )}
        {!loading && !user && (
          <Button block onClick={login} className="flex items-center gap-2">
            <GithubOutlined />
            GitHub 登录
          </Button>
        )}
        {!loading && user && (
          <Select
            defaultValue="language"
            placement="topLeft"
            button={{ block: true, bordered: false, className: 'py-2.5', size: 'large' }}
            labelRender={() => (
              <div className="flex w-full items-center gap-2.5">
                {user.avatar_url ? (
                  <Avatar
                    size={26}
                    src={user.avatar_url}
                    className="shrink-0"
                    style={{ borderRadius: 6 }}
                  />
                ) : (
                  <Avatar
                    size={26}
                    className="shrink-0"
                    style={{
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, #8d54ff, #7008e7)',
                    }}
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </Avatar>
                )}
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium">{user.username}</div>
                </div>
                <GithubFilled style={{ fontSize: 16 }} />
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
