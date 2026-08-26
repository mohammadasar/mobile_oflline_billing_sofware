import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Exclude SQLite WASM from dependency optimization to avoid bundling issues
    exclude: ['@capacitor-community/sqlite'],
  },
  build: {
    // Ensure the output directory matches Capacitor's webDir
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vite 6 (rolldown) requires manualChunks as a function
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
