import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Rails serves the API and uploaded photos (Active Storage).
      '/api/v1': { target: process.env.RAILS_API_URL || 'http://localhost:3000', changeOrigin: true },
      '/rails': { target: process.env.RAILS_API_URL || 'http://localhost:3000', changeOrigin: true },
    },
  },
});
