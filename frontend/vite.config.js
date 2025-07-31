import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    watch: {
      usePolling: true, // Use polling for file changes
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: ['es2020', 'edge90', 'firefox88', 'chrome90', 'safari14'],
    cssTarget: ['chrome90', 'firefox88', 'safari14'],
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  css: {
    postcss: {
      plugins: [
        // Autoprefixer will be added via package.json
      ]
    }
  },
  define: {
    // Polyfill global for older browsers
    global: 'globalThis'
  }
})
