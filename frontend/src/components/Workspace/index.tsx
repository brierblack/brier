import { memo, useMemo, useState } from 'react';
import { Dropdown, Input, Menu } from 'antd';
import { DownOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { workspaces as initialWorkspaces } from '../../data/mockData';
import { Avatar } from './Avatar';

export const Workspace = memo(() => {
  const [workspaces] = useState(initialWorkspaces);
  const [currentId, setCurrentId] = useState(initialWorkspaces[0].id);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const current = workspaces.find((w) => w.id === currentId) ?? workspaces[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
      (w) => w.name.toLowerCase().includes(q) || w.host.toLowerCase().includes(q),
    );
  }, [workspaces, search]);

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      filtered.map((w) => ({
        key: String(w.id),
        label: (
          <div className="flex items-center gap-2 py-0.5">
            <Avatar workspace={w} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{w.name}</div>
            </div>
          </div>
        ),
      })),
    [filtered],
  );

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    setCurrentId(Number(key));
    setOpen(false);
  };

  const handleCreate = () => {
    setSearch('');
    setOpen(false);
  };

  const dropdownContent = (
    <div className="rounded-lg bg-white shadow-lg border border-[#e2e8f0] overflow-hidden">
      <div className="p-2">
        <Input
          placeholder="搜索工作空间"
          prefix={<SearchOutlined className="text-faint" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="small"
          variant="filled"
        />
      </div>
      <Menu
        mode="vertical"
        selectedKeys={[String(currentId)]}
        items={menuItems}
        onClick={handleMenuClick}
        className="!border-none !bg-transparent max-h-[280px] overflow-auto"
        style={{ paddingInline: 4 }}
      />
      <div className="border-t border-[#e2e8f0]">
        <button
          type="button"
          onClick={handleCreate}
          className="w-full flex items-center gap-2 px-3 h-9 text-[13px] text-faint hover:bg-black/[0.04] transition-colors cursor-pointer"
        >
          <PlusOutlined className="text-xs" />
          新建工作空间
        </button>
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-transparent border border-[#e2e8f0] hover:border-[#fe6e00] transition-colors cursor-pointer"
      >
        <Avatar workspace={current} />
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[13px] font-medium text-ink truncate">{current.name}</div>
        </div>
        <DownOutlined className="text-faint text-[10px] shrink-0" />
      </button>
    </Dropdown>
  );
});
