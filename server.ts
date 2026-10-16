import path from 'node:path'

const trustProxy = process.env.TRUST_PROXY || 'false'
if (trustProxy !== 'true' && trustProxy !== 'false')
  throw new Error('TRUST_PROXY must be true or false.')

const clientDirectory = path.join(import.meta.dirname, 'dist/client')
const serverEntry = path.join(import.meta.dirname, 'dist/server/server.js')
if (!(await Bun.file(serverEntry).exists()))
  throw new Error('Production build missing. Run bun run build first.')

const { default: app }: {
  default: { fetch: (request: Request) => Response | Promise<Response> }
} = await import(serverEntry)

// An allowlist of built public files prevents request paths from reaching
// server code, .env files, or anything else outside the client build.
const assets = new Map<string, { file: Bun.BunFile; immutable: boolean }>()
for await (const relative of new Bun.Glob('**/*').scan(clientDirectory)) {
  const pathname = '/' + relative.replaceAll('\\', '/')
  // Only the public offline fallback may be served as static HTML.
  if (pathname.endsWith('.map')) continue
  if (pathname.endsWith('.html') && pathname !== '/offline.html') continue
  assets.set(pathname, {
    file: Bun.file(path.join(clientDirectory, relative)),
    immutable: /^\/assets\/.+-[\w-]{8,}\.[^/]+$/.test(pathname),
  })
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  hostname: process.env.HOST ?? '0.0.0.0',
  development: false,
  // There are no file uploads; bound JSON/form parsing before auth/validation.
  maxRequestBodySize: 64 * 1024,
  async fetch(request, server) {
    const asset = assets.get(new URL(request.url).pathname)
    if (asset && (request.method === 'GET' || request.method === 'HEAD')) {
      return new Response(request.method === 'HEAD' ? null : asset.file, {
        headers: {
          'Content-Type': asset.file.type,
          'Content-Length': String(asset.file.size),
          'Cache-Control': asset.immutable
            ? 'public, max-age=31536000, immutable'
            : 'no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
    if (trustProxy === 'false') {
      // Better Auth reads X-Forwarded-For. On a direct deployment that header
      // belongs to the caller, so replace it with the actual socket address.
      const headers = new Headers(request.headers)
      const address = server.requestIP(request)?.address
      if (address) headers.set('X-Forwarded-For', address)
      else headers.delete('X-Forwarded-For')
      request = new Request(request, { headers })
    }
    // SSR, auth and RPC responses retain the app's private/no-store headers.
    const response = await app.fetch(request)
    if (!response.headers.has('Cache-Control'))
      response.headers.set('Cache-Control', 'private, no-store')
    return response
  },
  error(error) {
    console.error(error)
    return new Response('Something went wrong. Please try again.', {
      status: 500,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  },
})

console.log(`Reset listening on ${server.url}`)

let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  await server.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
