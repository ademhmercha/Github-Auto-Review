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
    include: ['src/**/*.test.js'],
    reporters: ['default', 'junit'],
    outputFile: { junit: './test-results/junit.xml' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura', 'html'],
      reportsDirectory: './coverage',
      // Couverture de la logique métier ; l'interface React n'est pas testée ici.
      include: ['src/agents/**', 'src/lib/**', 'src/orchestrator/**'],
    },
  },
});
