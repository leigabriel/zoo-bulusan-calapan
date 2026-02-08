import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
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
  envPrefix: 'VITE_'
})