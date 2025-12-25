import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    hmr: { overlay: true },
    proxy: {
      // Proxy untuk Backend API
      '/api': {
        target: 'http://tpms.solonet.net.id', // Ganti dengan URL backend Anda
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Proxy khusus untuk Alerts API (bypass CORS)
      '/alerts-api': {
        target: 'http://10.86.215.10:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/alerts-api/, ''),
      },
      // Proxy untuk WebSocket (jika diperlukan)
      '/ws': {
        target: 'wss://tpms.solonet.net.id', // Ganti dengan URL WebSocket Anda
        ws: true,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      services: resolve(__dirname, 'src/services'),
    },
  },
});
