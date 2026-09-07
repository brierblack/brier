import { memo } from 'react';
import { Avatar, Button, Select } from '@brierb/brier-ui';
import { PlusOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Workspace } from '@/api/generated';
import { useSpace } from '@/context/SpaceContext';

const COLORS = [
  'linear-gradient(135deg, #0a0a0a, #262626)',
  'linear-gradient(135deg, #262626, #404040)',
  'linear-gradient(135deg, #404040, #595959)',
  'linear-gradient(135deg, #1f2937, #111827)',
  'linear-gradient(135deg, #3f3f46, #27272a)',
];

/** 工作空间头像：有 avatar 显示图片，否则名字首字母 + 名字哈希渐变色块 */
const renderWorkspaceAvatar = (w: Workspace) => {
  if (w.avatar) {
    return <Avatar src={w.avatar} shape="square" size={20} alt={w.name} />;
  }
  const colorIdx = w.name.charCodeAt(0) % COLORS.length;
  return (
    <Avatar
      shape="square"
      size={20}
      style={{ background: COLORS[colorIdx] }}
      className="!text-[10px]! !font-bold!"
    >
      {w.name.slice(0, 1).toUpperCase()}
    </Avatar>
  );
};

export const WorkSpace = memo(() => {
  const navigate = useNavigate();
  const { spaces, currentSpaceId, setCurrentSpaceId } = useSpace();

  const current = spaces.find((w) => w.id === currentSpaceId);

  const options = spaces.map((w) => ({
    value: w.id,
    label: (
      <div className="flex items-center gap-2">
        {renderWorkspaceAvatar(w)}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{w.name}</div>
        </div>
      </div>
    ),
  }));

  const handleChange = (val: string) => {
    setCurrentSpaceId(val);
  };

  if (!current) {
    return (
      <Button
        block
        type="text"
        onClick={() => navigate('/space/new')}
        classNames={{ root: ' !border-ghost !px-2' }}
      >
        <PlusOutlined className="text-standard" />
        <span className="flex-1 text-left">新建工作空间</span>
      </Button>
    );
  }

  return (
    <Select
      value={current.id}
      onChange={(val) => handleChange(val as string)}
      options={options}
      showSearch={{
        filterOption: (input, option) => {
          const w = spaces.find((ws) => ws.id === option?.value);
          if (!w) return false;
          const q = input.toLowerCase();
          return w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q);
        },
      }}
      labelRender={({ value }) => {
        const w = spaces.find((ws) => ws.id === value);
        if (!w) return null;
        return (
          <div className="flex w-full items-center justify-between gap-2">
            {renderWorkspaceAvatar(w)}
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate font-medium">{w.name}</div>
            </div>
            <span className="flex shrink-0 items-center gap-0.5 text-[12px]">
              切换
              <SwapOutlined />
            </span>
          </div>
        );
      }}
      notFoundContent="暂无工作空间"
      button={{ block: true, className: 'px-2!' }}
      footer={
        <Button
          className="flex! justify-start! gap-2! p-3!"
          block
          bordered={false}
          type="text"
          onClick={() => navigate('/space/new')}
        >
          <PlusOutlined className="text-standard" />
          新建工作空间
        </Button>
      }
    />
  );
});
