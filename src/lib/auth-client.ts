import { createAuthClient } from 'better-auth/react'
import { usernameClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [usernameClient()],
})

/** Non-routable internal email synthesized from the username (never shown, never mailed). */
export function internalEmailFor(usernameValue: string): string {
  return `${usernameValue.trim().toLowerCase()}@users.reset.internal`
}
