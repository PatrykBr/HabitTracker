import { createFileRoute } from '@tanstack/react-router'
import { auth } from '../../../lib/auth'

/** Better Auth handler — serves all /api/auth/* endpoints. */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => auth.handler(request),
      POST: ({ request }: { request: Request }) => auth.handler(request),
    },
  },
})
