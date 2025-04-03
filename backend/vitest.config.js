import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // This makes test functions like describe, it, etc. available globally
    environment: 'node',
    include: ['**/__tests__/**/*.test.js'],
    coverage: {
      provider: 'c8', // or 'v8'
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        'coverage',
        'src/server.js',
        'src/utils/logger.js',
        'src/config/**',
      ],
    },
  },
}); 