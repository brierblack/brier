import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, SwapOutlined } from '@ant-design/icons';
import { Avatar, Button, Select } from '@brierb/brier-ui';
import { useSpace } from '@/context/SpaceContext';
import { Empty } from 'antd';

export const SpaceSelect = memo(() => {
  const navigate = useNavigate();
  const { spaces, currentSpaceId, setCurrentSpaceId } = useSpace();

  const currentSpace = spaces.find((s) => s.id === currentSpaceId);

  if (!currentSpace) {
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

  const options = spaces.map((s) => ({
    value: s.id,
    label: (
      <div className="flex items-center gap-2">
        <Avatar src={s.avatar} shape="square" size={20} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{s.name}</div>
        </div>
      </div>
    ),
  }));

  return (
    <Select
      value={currentSpace.id}
      onChange={(val) => setCurrentSpaceId(val)}
      options={options}
      showSearch={{
        filterOption: (input, option) => {
          const space = spaces.find((s) => s.id === option?.value);
          if (space) {
            const q = input.toLowerCase();
            return space.name.toLowerCase().includes(q) || space.slug.toLowerCase().includes(q);
          }
          return false;
        },
      }}
      labelRender={({ value }) => {
        const space = spaces.find((s) => s.id === value);
        if (space) {
          return (
            <div className="flex w-full items-center justify-between gap-2">
              <Avatar src={space.avatar} shape="square" size={20} />
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate font-medium">{space.name}</div>
              </div>
              <span className="flex shrink-0 items-center gap-0.5 text-[12px]">
                切换
                <SwapOutlined />
              </span>
            </div>
          );
        }
      }}
      notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      button={{ block: true, className: 'px-2!' }}
      footer={
        <Button
          className="flex! justify-start! gap-3! px-3! py-1!"
          block
          bordered={false}
          type="text"
          onClick={() => navigate('/space/new')}
        >
          <PlusOutlined className="text-standard" size={18} />
          新建工作空间
        </Button>
      }
    />
  );
});
