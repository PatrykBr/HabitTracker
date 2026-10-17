import { useEffect } from 'react'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { THEME_INIT_SCRIPT, watchSystemTheme } from '../lib/theme'
import appCss from '../styles.css?url'

const APPLE_SPLASH: Array<[string, string]> = [
  [
    '/splash/apple-splash-1290x2796.png',
    '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
  ],
  [
    '/splash/apple-splash-1284x2778.png',
    '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
  ],
  [
    '/splash/apple-splash-1179x2556.png',
    '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
  ],
  [
    '/splash/apple-splash-1170x2532.png',
    '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
  ],
  [
    '/splash/apple-splash-1125x2436.png',
    '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
  ],
  [
    '/splash/apple-splash-1242x2688.png',
    '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
  ],
  [
    '/splash/apple-splash-828x1792.png',
    '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
  ],
  [
    '/splash/apple-splash-750x1334.png',
    '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
  ],
]

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { title: 'Reset — quit tracker' },
      {
        name: 'description',
        content:
          'Track the habits you’re quitting: live streaks, honest resets, real progress.',
      },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      { name: 'apple-mobile-web-app-title', content: 'Reset' },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: dark)',
        content: '#000000',
      },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: light)',
        content: '#eff2f6',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/icons/favicon-32.png', type: 'image/png' },
      { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-180.png' },
      ...APPLE_SPLASH.map(([href, media]) => ({
        rel: 'apple-touch-startup-image',
        href,
        media,
      })),
    ],
  }),
  notFoundComponent: NotFound,
  errorComponent: RootError,
  shellComponent: RootDocument,
})

function RootError() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="t-title2">We couldn’t open Reset</h1>
      <p className="t-subhead text-(--text-2)">
        Check your connection and try again. Your streaks keep counting.
      </p>
      <button
        type="button"
        className="btn btn-tinted w-auto"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </main>
  )
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-5xl">🧭</div>
      <h1 className="text-xl font-bold tracking-tight">This page isn’t here</h1>
      <p className="text-[0.9375rem] text-(--text-2)">
        No worries — your streaks are safe.
      </p>
      <Link
        to="/"
        className="btn btn-tinted mt-2 w-auto no-underline"
      >
        Back to your habits
      </Link>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Service worker is progressive enhancement — production only, never blocks.
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    return watchSystemTheme()
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Server and client bundles may print the inlined function slightly differently. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <div className="app-canvas" aria-hidden />
        {children}
        <TanStackDevtools
          config={{
            position: 'top-right',
            requireUrlFlag: true,
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
