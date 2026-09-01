/**
 * 所有图标组件统一 props。
 * 基础大小：size 默认 16（与 16x16 viewBox 1:1 渲染，最清晰）。
 */
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /** 图标渲染尺寸（px），默认 16 */
  size?: number;
}
