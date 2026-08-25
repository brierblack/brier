export const DRAG_TYPE = 'drag-line';

export const DEFAULT_WIDTH = 288;
export const MIN_WIDTH = 200;
export const MAX_WIDTH = 480;

export const clampWidth = (w: number, min: number, max: number) => Math.max(min, Math.min(max, w));
