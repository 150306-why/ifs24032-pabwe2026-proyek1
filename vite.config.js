import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules/**', 'dist/**', 'backend/**'],
    setupFiles: ['./src/setupTests.js'],
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/**/*.test.js', 'src/setupTests.js', 'src/test-utils.js'],
    },
  },
});
