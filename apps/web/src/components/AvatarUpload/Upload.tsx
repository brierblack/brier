import { memo, useState } from 'react';
import { Spin, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { compressImage } from './utils';

interface AvatarUploadProps {
  /** 受控值：当前头像 dataURL（配合 Form.Item name 使用时由表单注入） */
  value?: string;
  size?: number;
  /** 压缩完成后回调（写入表单字段 / 外部受控状态） */
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
    value,
    size = 80,
    onChange,
    accept = 'image/*',
    rounded = 'md',
    label,
  }: AvatarUploadProps) => {
    const [loading, setLoading] = useState(false);

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
        <Spin spinning={loading} size="small">
          <div
            style={{ width: size, height: size }}
            className={`relative flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-ghost transition-colors hover:border-brand ${ROUNDED_CLASS[rounded]}`}
          >
            {value ? (
              <img
                src={value}
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
        </Spin>
      </Upload>
    );
  },
);
