import { useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export default function Devtools() {
  const { searchStr } = useLocation()
  return new URLSearchParams(searchStr).has('tanstack-devtools')
    ? <TanStackRouterDevtools position="top-right" />
    : null
}
