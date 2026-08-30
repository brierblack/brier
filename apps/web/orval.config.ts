import { defineConfig } from 'orval';

export default defineConfig({
  brier: {
    input: './openapi.json',
    output: {
      target: './src/api/generated.ts',
      client: 'fetch',
      mode: 'single',
      baseUrl: '/',
      override: {
        // 只返回 data，不生成 xxxResponse200/404 等判别联合类型外壳
        // （错误统一由 customFetch 抛异常，调用方无需感知 status）
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: './src/api/custom-instance.ts',
          name: 'customFetch',
        },
      },
    },
  },
});
