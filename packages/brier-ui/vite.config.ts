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
          dest: 'es/assets',
        },
        {
          src: 'src/tailwind.css',
          dest: 'es',
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
    },
    rollupOptions: {
      external: [
        '@ant-design/icons',
        'antd',
        'antd/locale/zh_CN',
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dnd',
        'react-dnd-html5-backend',
      ],
      output: {
        dir: 'es',
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
});
