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
        mutator: {
          path: './src/api/custom-instance.ts',
          name: 'customFetch',
        },
      },
    },
  },
});
