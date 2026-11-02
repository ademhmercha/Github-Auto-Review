import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  test: {
    // La logique testée (agents, appels API, parsing) ne touche pas au DOM.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    reporters: ['default', 'junit'],
    outputFile: { junit: './test-results/junit.xml' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Logique métier et interface React (tests de composants en jsdom).
      include: ['src/agents/**', 'src/lib/**', 'src/orchestrator/**', 'src/components/**', 'src/App.jsx', 'src/main.jsx'],
    },
  },
});
