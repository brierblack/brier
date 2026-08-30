import type { CSSProperties } from 'react';

/**
 * 所有图标组件统一 props。
 * 基础大小：size 默认 16（与 16x16 viewBox 1:1 渲染，最清晰）。
 */
export interface IconProps {
  /** 图标渲染尺寸（px），默认 16 */
  size?: number;
  /** 附加类名 */
  className?: string;
  /** 行内样式 */
  style?: CSSProperties;
}
