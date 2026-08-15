import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@water-business/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@water-business/calculations': path.resolve(__dirname, '../../packages/calculations/src/index.ts'),
      '@water-business/validation': path.resolve(__dirname, '../../packages/validation/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
