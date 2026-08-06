import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import OfflineBanner from '../components/OfflineBanner'
import TabBar from '../components/TabBar'
import { getSessionUser } from '../lib/auth.functions'

/**
 * Authenticated shell: session guard (UX — every server function re-checks
 * auth itself), offline banner, centered column, floating tab bar.
 */
export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const user = await getSessionUser()
    if (!user) {
      throw redirect({ to: '/login', replace: true })
    }
    return { user }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col safe-x">
      <OfflineBanner />
      <main className="flex-1 px-4 pb-32 safe-top">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
