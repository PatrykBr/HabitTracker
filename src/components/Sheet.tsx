import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  /** Set false to block Escape/backdrop dismissal (e.g. while a request is in flight). */
  dismissible?: boolean
  children: ReactNode
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

/**
 * iOS-style bottom sheet (centered dialog on wider screens). Replaces native
 * alert()/confirm() everywhere. Moves focus into the sheet, keeps Tab inside
 * it, and restores focus to the opener on close.
 */
export default function Sheet({
  open,
  onClose,
  title,
  dismissible = true,
  children,
}: SheetProps) {
  const [mounted, setMounted] = useState(open)
  const closeTimer = useRef<number | undefined>(undefined)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const dismissibleRef = useRef(dismissible)
  dismissibleRef.current = dismissible

  useEffect(() => {
    if (open) {
      window.clearTimeout(closeTimer.current)
      setMounted(true)
    } else if (mounted) {
      closeTimer.current = window.setTimeout(() => setMounted(false), 220)
    }
    return () => window.clearTimeout(closeTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissibleRef.current) {
        onClose()
        return
      }
      // Keep Tab focus inside the sheet while it's open.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || active === panelRef.current)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      restoreFocusRef.current?.focus()
    }
  }, [mounted, onClose])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={dismissible ? onClose : undefined}
        className={`absolute inset-0 bg-black/45 ${open ? 'anim-fade-in' : 'anim-fade-out'}`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`glass relative w-full max-w-lg rounded-t-[1.75rem] px-5 pt-3 pb-5 outline-none safe-bottom sm:rounded-[1.75rem] sm:pb-6 ${
          open ? 'anim-sheet-up sm:anim-pop-in' : 'anim-sheet-down sm:anim-fade-out'
        }`}
        style={{ maxHeight: 'calc(100dvh - 3rem)', overflowY: 'auto' }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--text-3)] opacity-50 sm:hidden" />
        {title ? (
          <h2 className="mb-4 text-center text-lg font-bold tracking-tight">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  )
}
