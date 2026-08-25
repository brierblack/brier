import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  plugins: [
    react(),
    copy({
      targets: [
        {
          src: 'assets/*',
          dest: 'dist/assets',
        },
        {
          src: 'src/tailwind.css',
          dest: 'dist',
        },
      ],
      hook: 'writeBundle',
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        '@ant-design/icons',
        'antd',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dnd',
        'react-dnd-html5-backend',
      ],
    },
  },
});
