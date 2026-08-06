import path from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Service worker generation.
 *
 * vite-plugin-pwa's build step never runs alongside tanstackStart() (it
 * doesn't support Vite's environment API yet — TanStack/router#4988), so we
 * run Workbox's generateSW ourselves against dist/client once the ssr
 * environment (built after the client) finishes. The manifest is authored by
 * hand in public/manifest.webmanifest and linked from __root.tsx; the SW is
 * registered manually there too.
 */
function serviceWorker(): Plugin {
  return {
    name: 'reset-tracker:generate-sw',
    apply: 'build',
    applyToEnvironment: (env) => env.name === 'ssr',
    async closeBundle() {
      const clientDist = path.resolve(import.meta.dirname, 'dist/client')
      const { generateSW } = await import('workbox-build')
      const { count, size, warnings } = await generateSW({
        swDest: path.join(clientDist, 'sw.js'),
        globDirectory: clientDist,
        globPatterns: ['**/*.{js,css,svg,png,webmanifest,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        sourcemap: false,
        runtimeCaching: [
          {
            // SSR'd pages: network first, cached copy when offline.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'image' || request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-media',
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      })
      for (const warning of warnings) console.warn('[workbox]', warning)
      console.log(
        `[workbox] sw.js generated — ${count} precached files (${(size / 1024).toFixed(1)} KiB)`,
      )
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    serviceWorker(),
  ],
})

export default config
