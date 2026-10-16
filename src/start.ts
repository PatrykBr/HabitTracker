import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { errorAdapter } from './lib/errors.serialization'

const privateResponses = createMiddleware().server(({ next }) => {
  // SSR HTML includes dehydrated session/loader data, even for data-only routes.
  setResponseHeader('Cache-Control', 'private, no-store')
  setResponseHeader('X-Content-Type-Options', 'nosniff')
  return next()
})

export const startInstance = createStart(() => ({
  serializationAdapters: [errorAdapter],
  requestMiddleware: [
    privateResponses,
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === 'serverFn' }),
  ],
}))
