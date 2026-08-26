import { useEffect, useRef, useState } from 'react';
import { Avatar, Dropdown, Menu, type MenuProps } from 'antd';
import { Button } from '@hiveblack/ui';
import {
  GithubOutlined,
  LogoutOutlined,
  MessageOutlined,
  ControlOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../../define';
import { Logo, Wordmark } from '../../components/Logo';
import { WorkSpace } from '@/components/WorkSpace';
import { useAuth } from '../../auth-context';

const recentConversations = [
  { id: 1, title: '优化数据库查询性能' },
  { id: 2, title: '修复登录页 OAuth 回调' },
  { id: 3, title: '重构 API 服务层架构' },
  { id: 4, title: '编写单元测试覆盖率报告' },
  { id: 5, title: '部署 v2.3 到预发环境' },
  { id: 6, title: '分析用户留存数据' },
  { id: 7, title: '设计 Agent 协作流程图' },
];

const olderConversations = [
  { id: 8, title: '排查生产环境内存泄漏' },
  { id: 9, title: '升级 React 到 v19' },
  { id: 10, title: '设计权限模型重构方案' },
  { id: 11, title: '优化 Docker 构建缓存' },
  { id: 12, title: '编写 API 文档自动生成' },
];

const menuClassNames = {
  root: ' !border-none !grid !gap-1 !bg-transparent',
  item: ' !px-2 !m-0 !h-8 !leading-8 !text-sm !w-full',
};

const menuItems: MenuProps['items'] = [
  { key: 'new-chat', icon: <MessageOutlined />, label: '新会话' },
  { key: 'automation', icon: <ControlOutlined />, label: '自动化' },
  { type: 'divider' },
  ...NAV_ITEMS.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  })),
  { type: 'divider' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, login, logout } = useAuth();
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [olderExpanded, setOlderExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showShadow, setShowShadow] = useState(false);

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

  const selectedKey = location.pathname === '/chat' ? 'new-chat' : location.pathname.slice(1);

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: logout },
  ];

  const recentItems: MenuProps['items'] = recentConversations.map((conv) => ({
    key: `conv-${conv.id}`,
    icon: <MessageOutlined />,
    label: conv.title,
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
            if (e.key === 'automation') return;
            if (e.key === 'new-chat') {
              navigate('/chat');
              return;
            }
            navigate(`/${e.key}`);
          }}
          classNames={menuClassNames}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1">
        <div
          className="group flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm font-medium hover:bg-[#f5f5f5]"
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
            onClick={() => {}}
            classNames={menuClassNames}
          />
        )}

        <div
          className="group flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm font-medium hover:bg-[#f5f5f5]"
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
            onClick={() => {}}
            classNames={menuClassNames}
          />
        )}
      </div>

      <div
        className={`shrink-0 px-4 py-3 transition-shadow duration-200 ${showShadow ? 'shadow-[0_-8px_12px_-8px_rgba(0,0,0,0.12)]' : 'shadow-none'}`}
      >
        {loading && (
          <div className="flex items-center gap-2.5">
            <Avatar
              size={32}
              className="shrink-0"
              style={{ borderRadius: 6, background: '#e0e0e0' }}
            />
            <div className="min-w-0">
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
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="topLeft">
            <div className="flex cursor-pointer items-center gap-2.5">
              {user.avatar_url ? (
                <Avatar
                  size={32}
                  src={user.avatar_url}
                  className="shrink-0"
                  style={{ borderRadius: 6 }}
                />
              ) : (
                <Avatar
                  size={32}
                  className="shrink-0"
                  style={{
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #8d54ff, #7008e7)',
                  }}
                >
                  {user.login.slice(0, 2).toUpperCase()}
                </Avatar>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{user.name ?? user.login}</div>
                <div className="truncate text-[11px]">{user.email ?? user.login}</div>
              </div>
            </div>
          </Dropdown>
        )}
      </div>
    </div>
  );
}
