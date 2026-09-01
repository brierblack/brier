import { memo, useEffect, useMemo, useState } from 'react';
import { Button, Select } from '@brierb/brier-ui';
import { PlusOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
import { listWorkspaces, type Workspace } from '@/api/generated';

const CREATE_VALUE = '__create__';

export const WorkSpace = memo(() => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string>('');

  useEffect(() => {
    listWorkspaces().then((data) => {
      setWorkspaces(data);
      setCurrentId(data[0]?.id ?? '');
    });
  }, []);

  const current = workspaces.find((w) => w.id === currentId) ?? workspaces[0];

  const options = useMemo(
    () => [
      ...workspaces.map((w) => ({
        value: w.id,
        label: (
          <div className="flex items-center gap-2">
            <Avatar workspace={w} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{w.name}</div>
            </div>
          </div>
        ),
        workspace: w,
      })),
    ],
    [workspaces],
  );

  const handleChange = (val: string) => {
    if (val === CREATE_VALUE) {
      navigate('/space/new');
      return;
    }
    setCurrentId(val);
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
      value={currentId}
      onChange={(val) => handleChange(val as string)}
      options={options}
      showSearch={{
        filterOption: (input, option) => {
          if (option?.value === CREATE_VALUE) return true;
          const w = workspaces.find((ws) => ws.id === option?.value);
          if (!w) return false;
          const q = input.toLowerCase();
          return w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q);
        },
      }}
      labelRender={({ value }) => {
        const w = workspaces.find((ws) => ws.id === value);
        if (!w) return null;
        return (
          <div className="flex w-full items-center justify-between gap-2">
            <Avatar workspace={w} />
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
