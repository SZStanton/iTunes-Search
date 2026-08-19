import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite config for React frontend
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // proxy API requests to the Express backend
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
