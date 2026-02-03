import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    host: true, // Permitir acceso desde cualquier host
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      // Usar un puerto diferente para HMR para evitar conflictos con Console Ninja
      port: 24678,
      clientPort: 24678,
    },
    // Forzar HTTP/1.1 para evitar errores 426
    http2: false,
    watch: {
      usePolling: false,
    },
  },
  // Optimizaciones para evitar errores 426
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
    force: false,
  },
  // Deshabilitar características que pueden causar problemas
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  // Deshabilitar Console Ninja si causa problemas
  define: {
    __CONSOLE_NINJA__: false,
  },
});
