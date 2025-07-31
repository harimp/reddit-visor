import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    watch: {
      usePolling: true, // Use polling for file changes
    },
    proxy: {
      // Proxy Reddit API calls to avoid CORS issues, especially in Safari
      '/api/reddit': {
        target: 'https://www.reddit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/reddit/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers for Safari compatibility
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,User-Agent,X-Requested-With';
            proxyRes.headers['Access-Control-Max-Age'] = '86400'; // 24 hours
            
            // Handle Safari's stricter cookie policies
            if (req.headers['user-agent'] && req.headers['user-agent'].includes('Safari')) {
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'false';
            }
          });
        }
      },
      // Proxy OAuth endpoints
      '/api/oauth': {
        target: 'https://oauth.reddit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/oauth/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers for OAuth requests
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,User-Agent';
            proxyRes.headers['Access-Control-Max-Age'] = '3600'; // 1 hour for OAuth
          });
        }
      }
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
