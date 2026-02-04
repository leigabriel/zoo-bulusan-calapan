import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize chunk size for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          tensorflow: ['@tensorflow/tfjs'],
          charts: ['apexcharts', 'react-apexcharts'],
          calendar: ['@fullcalendar/daygrid', '@fullcalendar/react', '@fullcalendar/interaction', '@fullcalendar/list', '@fullcalendar/timegrid']
        }
      }
    }
  },
  // Ensure environment variables are properly loaded
  envPrefix: 'VITE_'
})