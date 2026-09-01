import { memo } from 'react';
import { Upload, type UploadProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

interface AvatarUploadProps extends UploadProps {
  avatarUrl?: string;
  size?: number;
}

export const AvatarUpload = memo(({ avatarUrl, size, ...uploadProps }: AvatarUploadProps) => {
  return (
    <Upload showUploadList={false} className="flex items-center" {...uploadProps}>
      <div
        style={{ width: size, height: size }}
        className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded border border-dashed border-ghost transition-colors hover:border-brand"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <PlusOutlined className="text-standard" />
        )}
      </div>
    </Upload>
  );
});
