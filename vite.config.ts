import path from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

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
        globPatterns: [
          '**/*.{js,css,svg,png,webmanifest,woff2}',
          'offline.html',
        ],
        importScripts: ['/sw-cleanup.js'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        sourcemap: false,
        runtimeCaching: [
          {
            // SSR HTML contains private loader data. Never put it in Cache Storage.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkOnly',
            options: {
              precacheFallback: { fallbackURL: '/offline.html' },
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

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    serviceWorker(),
  ],
})
