import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window', // Polyfill global thành window
  },
  optimizeDeps: {
    include: ['sockjs-client', 'stompjs'], // Đảm bảo Vite tối ưu hóa các thư viện này
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
      },
    },
  }
});