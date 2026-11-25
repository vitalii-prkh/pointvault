import { defineConfig } from 'vitest/config';

/**
 * Black-box tests against the running container stack (`npm run stack:up`). Nothing is imported from src/:
 * the tests only speak HTTP, exactly like a real client.
 */
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/stack/**/*.stack-spec.ts'],
    testTimeout: 15_000,
  },
});
