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
 * Check the session before showing the app layout, tabs, and add-habit sheet.
 * Server functions independently check authentication before accessing data.
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
