interface CompressOptions {
  maxSize?: number;
  quality?: number;
  mimeType?: string;
}

const DEFAULTS: Required<CompressOptions> = {
  maxSize: 256,
  quality: 0.8,
  mimeType: 'image/jpeg',
};

/**
 * Canvas 压缩图片：读取文件 → 加载到 Image → 等比缩放绘制 → toDataURL。
 * 不放大；PNG 透明通道会丢失（统一输出 JPEG）。
 */
export async function compressImage(file: File, options?: CompressOptions): Promise<string> {
  const { maxSize, quality, mimeType } = { ...DEFAULTS, ...options };

  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL(mimeType, quality);
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
