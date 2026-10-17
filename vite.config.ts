import path from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { nitro } from 'nitro/vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Generate the service worker after the server build and public asset copy.
 * vite-plugin-pwa did not emit sw.js with this multi-environment build
 * setup. See TanStack/router#4988. The root route links the public manifest
 * and registers the worker.
 */
async function generateServiceWorker(clientDist: string) {
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
}

function serviceWorker(): Plugin {
  return {
    name: 'reset-tracker:generate-sw',
    apply: 'build',
    applyToEnvironment: (env) => env.name === (vercelBuild ? 'nitro' : 'ssr'),
    closeBundle: () => generateServiceWorker(path.resolve(
      import.meta.dirname,
      vercelBuild ? '.vercel/output/static' : 'dist/client',
    )),
  }
}

const vercelBuild = process.env.VERCEL === '1' || process.env.NITRO_PRESET === 'vercel'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    vercelBuild && nitro({
      preset: 'vercel',
      // server.ts starts the standalone Bun server. Nitro uses Start's SSR service.
      serverEntry: false,
      routeRules: {
        // Redirect responses can bypass Start's response headers.
        '/**': { headers: { 'cache-control': 'private, no-store' } },
        '/sw.js': { headers: { 'cache-control': 'no-cache' } },
        '/sw-cleanup.js': { headers: { 'cache-control': 'no-cache' } },
        '/offline.html': { headers: { 'cache-control': 'no-cache' } },
        '/manifest.webmanifest': { headers: { 'cache-control': 'no-cache' } },
      },
    }),
    viteReact(),
    serviceWorker(),
  ],
})
