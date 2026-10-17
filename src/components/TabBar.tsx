import { useEffect, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { IconHouse, IconPerson, IconPlus } from './Icons'

interface TabBarProps {
  /** Show the detached add-habit accessory. */
  showAdd: boolean
  onAdd: () => void
}

const TABS = [
  { to: '/', label: 'Habits', Icon: IconHouse },
  { to: '/you', label: 'You', Icon: IconPerson },
] as const

const TAB_W = 'clamp(84px, calc((100vw - 160px) / 2), 112px)'
const TAB_W_MIN = 56
const TAB_H = 54

/**
 * Show tabs and an optional add-habit button. Collapse to the selected tab
 * during downward scrolling and expand during upward scrolling.
 * Disable collapsing when the user prefers reduced motion.
 */
export default function TabBar({ showAdd, onAdd }: TabBarProps) {
  const { pathname } = useLocation()
  const activeIndex = pathname.startsWith('/you') ? 1 : 0
  const [minimized, setMinimized] = useState(false)

  useEffect(() => {
    setMinimized(false)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let lastY = window.scrollY
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        const y = window.scrollY
        const maxY =
          document.documentElement.scrollHeight - window.innerHeight
        const dy = y - lastY
        lastY = y
        if (y <= 24 || y >= maxY - 24) setMinimized(false)
        else if (dy > 4) setMinimized(true)
        else if (dy < -4) setMinimized(false)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [pathname])

  const tabWidth = minimized ? TAB_W_MIN : TAB_W
  const transition =
    'width 0.45s var(--spring), opacity 0.2s var(--ease-out), transform 0.45s var(--spring)'

  return (
    <>
      <div className="scroll-edge scroll-edge-bottom z-30" aria-hidden />
      <nav
        aria-label="Main"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-center gap-3 px-4 safe-x"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
      >
        <div
          className="glass pointer-events-auto relative flex shrink-0 rounded-full p-1.5"
          style={{ transition }}
        >
          {/* Selection pill slides between tabs */}
          <span
            aria-hidden
            className="tab-selection absolute top-1.5 bottom-1.5 left-1.5 rounded-full"
            style={{
              width: tabWidth,
              transform: `translateX(${minimized || activeIndex === 0 ? '0px' : TAB_W})`,
              transition,
            }}
          />
          {TABS.map(({ to, label, Icon }, i) => {
            const active = i === activeIndex
            const hidden = minimized && !active
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                aria-hidden={hidden || undefined}
                tabIndex={hidden ? -1 : undefined}
                className="relative flex flex-col items-center justify-center overflow-hidden rounded-full no-underline"
                style={{
                  width: hidden ? 0 : tabWidth,
                  height: minimized ? TAB_H : `max(${TAB_H}px, 3.125rem)`,
                  opacity: hidden ? 0 : 1,
                  color: active ? 'var(--accent-text)' : 'var(--text-2)',
                  transition,
                }}
              >
                <Icon filled={active} className="h-6 w-6 shrink-0" />
                <span
                  className="t-caption2 mt-0.5 font-semibold whitespace-nowrap"
                  style={{
                    height: minimized ? 0 : '1.18em',
                    opacity: minimized ? 0 : 1,
                    overflow: 'hidden',
                    transition: 'height 0.3s var(--ease-out), opacity 0.15s',
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>

        {showAdd ? (
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add a habit"
            className="glass glass-press anim-pop-in pointer-events-auto flex h-16.5 w-16.5 shrink-0 items-center justify-center rounded-full text-(--accent-text)"
          >
            <IconPlus className="h-7 w-7" />
          </button>
        ) : null}
      </nav>
    </>
  )
}
