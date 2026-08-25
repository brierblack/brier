import React, { memo, useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, Input, theme } from 'antd';
import { PlusOutlined, SwapOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import type { Workspace } from '@/types';
import { fetchWorkspaces } from '@/services/workspace';
import { Avatar } from './Avatar';

export const WorkSpace = memo(() => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string>('');
  const [search, setSearch] = useState('');
  const { token } = theme.useToken();

  useEffect(() => {
    fetchWorkspaces().then((data) => {
      setWorkspaces(data);
      setCurrentId(data[0]?.id ?? '');
    });
  }, []);

  const current = workspaces.find((w) => w.id === currentId) ?? workspaces[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
      (w) => w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q),
    );
  }, [workspaces, search]);

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      filtered.map((w) => ({
        key: w.id,
        label: (
          <div className="flex items-center gap-2 py-0.5">
            <Avatar workspace={w} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{w.name}</div>
            </div>
          </div>
        ),
      })),
    [filtered],
  );

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    setCurrentId(key);
  };

  const handleCreate = () => {
    setSearch('');
    navigate('/spaces/new');
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    borderRadius: token.borderRadiusLG,
    boxShadow: 'none',
    border: '1px solid var(--color-line)',
  };

  const menuStyle: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    borderRadius: 'none',
    boxShadow: 'none',
  };

  const dropdownContent = (menu: React.ReactNode) => (
    <div style={contentStyle}>
      <div className="border-b border-line">
        <Input
          placeholder="搜索工作空间"
          prefix={<SearchOutlined className="text-faint" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          variant="filled"
          classNames={{ root: ' !bg-work' }}
          className="!border-transparent"
        />
      </div>

      {React.cloneElement(
        menu as React.ReactElement<{
          style: React.CSSProperties;
        }>,
        { style: menuStyle },
      )}
      <div className="border-t border-line">
        <Button
          block
          type="text"
          onClick={handleCreate}
          className=" bg-work rounded-none w-full flex items-center gap-2 px-3 h-9 text-faint transition-colors cursor-pointer"
        >
          <PlusOutlined className="text-xs" />
          新建工作空间
        </Button>
      </div>
    </div>
  );

  if (!current) {
    return (
      <Button block type="text" onClick={handleCreate} classNames={{ root: ' !border-line !px-2' }}>
        <PlusOutlined className="text-standard" />
        <span className="flex-1 text-left text-faint">新建工作空间</span>
      </Button>
    );
  }

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: handleMenuClick,
      }}
      popupRender={(menu) => dropdownContent(menu)}
      trigger={['click']}
    >
      <Button
        block
        type="text"
        classNames={{
          root: ' !border-line !px-2',
        }}
      >
        <Avatar workspace={current} />
        <div className="flex-1 min-w-0 text-left">
          <div className=" font-medium text-ink truncate">{current.name}</div>
        </div>
        <span className="flex items-center gap-0.5 text-faint text-[12px] shrink-0">
          切换
          <SwapOutlined />
        </span>
      </Button>
    </Dropdown>
  );
});
