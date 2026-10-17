import path from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Generate the service worker after the SSR build, which follows the client
 * build. vite-plugin-pwa did not emit sw.js with this multi-environment build
 * setup. See TanStack/router#4988. The root route links the public manifest
 * and registers the worker.
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
        `[workbox] Generated sw.js with ${count} precached files, ${(size / 1024).toFixed(1)} KiB.`,
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
