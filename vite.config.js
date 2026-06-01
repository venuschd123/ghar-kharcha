import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5174,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) requires manualChunks as a function, not an object
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) return 'vendor-recharts';
          if (id.includes('/motion/') || id.includes('/framer-motion/')) return 'vendor-motion';
          if (id.includes('/jspdf')) return 'vendor-pdf';
          if (id.includes('/dexie')) return 'vendor-dexie';
          if (id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/react/index')) return 'vendor-react';
        },
      },
    },
    chunkSizeWarningLimit: 600, // recharts chunk will be ~500kb, that's acceptable
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Ghar Kharcha - Home Construction Tracker',
        short_name: 'GharKharcha',
        description: 'Free home construction cost tracker for India. Track labour, materials, contractors and phases. 100% offline.',
        theme_color: '#10B981',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'en-IN',
        categories: ['finance', 'productivity', 'utilities'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        screenshots: [
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', form_factor: 'narrow', label: 'Dashboard' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', form_factor: 'wide', label: 'Reports' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
});
