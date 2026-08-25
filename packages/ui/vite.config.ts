import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        style: resolve(import.meta.dirname, 'src/index.css'),
      },
      output: {
        dir: 'dist',
        format: 'es',
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]', // CSS 会按 asset 处理
      },
      external: [
        '@ant-design/icons',
        'antd',
        'react',
        'react-dom',
        'react-dnd',
        'react-dnd-html5-backend',
      ],
    },
  },
});
