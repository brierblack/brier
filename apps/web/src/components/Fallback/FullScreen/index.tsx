import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export const FullScreen = () => {
  return (
    <div className="flex h-dvh items-center justify-center bg-surface">
      <Spin size="large" indicator={<LoadingOutlined spin />} />
    </div>
  );
};
