import { memo, useState } from 'react';
import { Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { compressImage } from './utils';

interface AvatarUploadProps {
  avatarUrl?: string;
  size?: number;
  onChange?: (dataUrl: string) => void;
  accept?: string;
  rounded?: 'sm' | 'md' | 'full';
  label?: string;
}

const ROUNDED_CLASS: Record<NonNullable<AvatarUploadProps['rounded']>, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  full: 'rounded-full',
};

export const AvatarUpload = memo(
  ({
    avatarUrl,
    size = 80,
    onChange,
    accept = 'image/*',
    rounded = 'md',
    label,
  }: AvatarUploadProps) => {
    const [, setLoading] = useState(false);

    return (
      <Upload
        showUploadList={false}
        accept={accept}
        beforeUpload={async (file) => {
          setLoading(true);
          try {
            const dataUrl = await compressImage(file);
            onChange?.(dataUrl);
          } catch {
            // 压缩失败静默忽略，用户可重试
          } finally {
            setLoading(false);
          }
          return false;
        }}
        className="flex items-center"
      >
        <div
          style={{ width: size, height: size }}
          className={`relative flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-ghost transition-colors hover:border-brand ${ROUNDED_CLASS[rounded]}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <>
              <PlusOutlined className="text-lg" />
              {label && <span className="mt-1 text-xs">{label}</span>}
            </>
          )}
        </div>
      </Upload>
    );
  },
);
