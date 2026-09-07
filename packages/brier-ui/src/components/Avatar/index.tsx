import { memo } from 'react';
import { Avatar as AntdAvatar, type AvatarProps as AntdAvatarProps } from 'antd';
import { CommentOutlined } from '@ant-design/icons';

export interface AvatarProps extends AntdAvatarProps {}

/** 无头像时的默认占位：浅灰蓝底 + 深灰蓝对话图标（避免主题近黑底白图标的生硬观感） */
const FALLBACK_STYLE = { background: '#eceff3', color: '#6b7a90' };

/**
 * 头像：有 src 时展示图片；未提供 src / icon / children 时回退为默认对话图标。
 */
export const Avatar = memo((props: AvatarProps) => {
  const { src, icon, children, className, style, ...rest } = props;
  const empty = !src && !icon && !children;

  return (
    <AntdAvatar
      src={src}
      icon={empty ? <CommentOutlined /> : icon}
      style={empty ? { ...FALLBACK_STYLE, ...style } : style}
      className={['shrink-0', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </AntdAvatar>
  );
});
