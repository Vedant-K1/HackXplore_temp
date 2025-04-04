import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // '/student': {
      //   target: 'http://127.0.0.1:5000', // Your Flask server address
      //   changeOrigin: true, // Recommended for virtual hosted sites, helps with CORS sometimes
      //   secure: false,      // Set to false if your backend is HTTP
      //   // Optional: Rewrite path if needed, but likely not necessary here
      //   // rewrite: (path) => path.replace(/^\/api/, '')
      // },
      // // Proxy requests that start with /teacher to your Flask backend
      // '/teacher': {
      //   target: 'http://127.0.0.1:5000',
      //   changeOrigin: true,
      //   secure: false,
      // },
       // You might also need to proxy socket.io if it connects to the same backend port
      //  '/socket.io': {
      //    target: 'ws://127.0.0.1:5000', // Use ws:// for websockets
      //    ws: true, // IMPORTANT: Enable WebSocket proxying
      //    changeOrigin: true,
      //    secure: false,
      //  }
    },
  },
})
