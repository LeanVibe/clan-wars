import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,svg,png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot}',
          '**/*.{json,webmanifest}'
        ],
        globIgnores: [
          '**/node_modules/**',
          '**/.DS_Store',
          '**/Thumbs.db'
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          // Game Core Scripts - Critical for gameplay
          {
            urlPattern: /\/packages\/game-core\/.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-core-scripts',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Game Components - UI critical
          {
            urlPattern: /\/src\/components\/.*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'game-components',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          // Game Assets - Images, SVGs, etc.
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
            },
          },
          // Stylesheets
          {
            urlPattern: /\.css$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'stylesheets',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          // API-like patterns for game data
          {
            urlPattern: /\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
          // External fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // CDN assets (Three.js, Lit, etc.)
          {
            urlPattern: /^https:\/\/cdn\./,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cdn-assets',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Game data files (card data, terrains, etc.)
          {
            urlPattern: /\/data\/.*\.(json|js)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'game-data',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Ninja Clan Wars',
        short_name: 'ClanWars',
        description: 'Competitive ninja-themed card game with AI-powered Three.js battlefield',
        theme_color: '#1e9ab0',
        background_color: '#121826',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/game/core', import.meta.url)),
      '@systems': fileURLToPath(new URL('./src/game/systems', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/game/data', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url))
    }
  },
  build: {
    target: 'es2022'
  },
  server: {
    port: 5173,
    open: false
  }
});
