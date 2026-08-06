import { useEffect } from 'react'
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

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
        content: '#07080c',
      },
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: light)',
        content: '#f2f3f7',
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
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-5xl">🧭</div>
      <h1 className="text-xl font-bold tracking-tight">
        This page isn’t here
      </h1>
      <p className="text-[0.9375rem] text-[var(--text-2)]">
        No worries — your streaks are safe.
      </p>
      <Link
        to="/"
        className="press mt-2 rounded-2xl bg-[var(--accent)] px-6 py-3 text-[0.9375rem] font-bold text-white no-underline"
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
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
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
