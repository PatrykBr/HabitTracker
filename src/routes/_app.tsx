import { useState } from 'react'
import {
  Outlet,
  createFileRoute,
  redirect,
  useLocation,
  useRouter,
} from '@tanstack/react-router'
import HabitSheet from '../components/HabitSheet'
import OfflineBanner from '../components/OfflineBanner'
import TabBar from '../components/TabBar'
import { fetchSessionUser } from '../lib/session'

/**
 * Authenticated shell: session guard (UX — every server function re-checks
 * auth itself), offline banner, centered column, floating tab bar with the
 * "add habit" accessory and the sheet it opens.
 */
export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const user = await fetchSessionUser()
    if (!user) {
      throw redirect({ to: '/login', replace: true })
    }
    return { user }
  },
  component: AppLayout,
})

function AppLayout() {
  const router = useRouter()
  const { pathname } = useLocation()
  const [addOpen, setAddOpen] = useState(false)
  // The accessory shows on the two tab roots; the habit detail has its own actions.
  const showAdd = pathname === '/' || pathname === '/you'

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col safe-x">
      <OfflineBanner />
      <main className="flex-1 px-4 pb-36">
        <Outlet />
      </main>
      <TabBar showAdd={showAdd} onAdd={() => setAddOpen(true)} />
      <HabitSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={async () => {
          if (pathname !== '/') await router.navigate({ to: '/' })
          await router.invalidate()
        }}
      />
    </div>
  )
}
