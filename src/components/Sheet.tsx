import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { IconXmark } from './Icons'

interface SheetProps {
  open: boolean
  onClose: () => void
  /** Also labels the dialog for assistive tech. */
  title: string
  /** Set false to block Escape/backdrop/drag dismissal (e.g. while a request is in flight). */
  dismissible?: boolean
  children: ReactNode
}

/**
 * How long the close animation runs (matches `anim-sheet-down` / `anim-fade-out`
 * in styles.css). Sheets with form state wait this long after `open` flips to
 * false before resetting, so the content doesn't change mid-animation.
 */
export const SHEET_CLOSE_MS = 240

/** Drag past this (px) or faster than this (px/ms) to dismiss. */
const DISMISS_DISTANCE = 140
const DISMISS_VELOCITY = 0.7

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

interface DragState {
  startY: number
  lastY: number
  lastT: number
  velocity: number
}

/**
 * Show a modal with a draggable header and scrollable content. Center it
 * on wider screens. Move focus in, trap Tab, and restore focus on close.
 */
export default function Sheet({
  open,
  onClose,
  title,
  dismissible = true,
  children,
}: SheetProps) {
  const [mounted, setMounted] = useState(open)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const closeFromEffect = useEffectEvent(onClose)
  const dismissibleRef = useRef(dismissible)
  dismissibleRef.current = dismissible
  const titleId = useId()

  const dragRef = useRef<DragState | null>(null)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)

  // Stay mounted through the close animation, then unmount.
  useEffect(() => {
    if (open) {
      // Capture the opener before mounting children: React's autoFocus runs
      // before passive effects and would otherwise replace it with an input.
      const active = document.activeElement
      if (active instanceof HTMLElement && !panelRef.current?.contains(active))
        restoreFocusRef.current = active
      setMounted(true)
      setDragY(0)
      return
    }
    const t = window.setTimeout(() => setMounted(false), SHEET_CLOSE_MS)
    return () => window.clearTimeout(t)
  }, [open])

  // A step change can remove the focused button without firing a focus event.
  // Keep focus in the dialog after each commit, while respecting autoFocus.
  useEffect(() => {
    const panel = panelRef.current
    if (mounted && panel && !panel.contains(document.activeElement)) panel.focus()
  })

  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissibleRef.current) {
        e.preventDefault()
        closeFromEffect()
        return
      }
      // Keep Tab focus inside the sheet while it's open.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).filter(
          (element) => element.tabIndex >= 0 && element.getClientRects().length > 0,
        )
        if (focusables.length === 0) {
          e.preventDefault()
          panelRef.current.focus()
          return
        }
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (
          e.shiftKey &&
          (active === first ||
            active === panelRef.current ||
            !panelRef.current.contains(active))
        ) {
          e.preventDefault()
          last.focus()
        } else if (
          !e.shiftKey &&
          (active === last || !panelRef.current.contains(active))
        ) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      if (restoreFocusRef.current?.isConnected) restoreFocusRef.current.focus()
    }
  }, [mounted])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dismissible || e.button !== 0) return
    if (e.target instanceof Element && e.target.closest('button')) return
    dragRef.current = {
      startY: e.clientY,
      lastY: e.clientY,
      lastT: performance.now(),
      velocity: 0,
    }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d) return
    const now = performance.now()
    const dt = Math.max(1, now - d.lastT)
    d.velocity = (e.clientY - d.lastY) / dt
    d.lastY = e.clientY
    d.lastT = now
    setDragY(Math.max(0, e.clientY - d.startY))
  }
  const onPointerEnd = () => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    setDragging(false)
    const distance = Math.max(0, d.lastY - d.startY)
    if (
      dismissible &&
      (distance > DISMISS_DISTANCE || d.velocity > DISMISS_VELOCITY)
    ) {
      onClose()
    } else {
      setDragY(0)
    }
  }

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={dismissible ? onClose : undefined}
        className={`absolute inset-0 bg-(--scrim) ${open ? 'anim-fade-in' : 'anim-fade-out'}`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`glass-strong relative mx-2 mb-2 flex w-full max-w-lg flex-col overflow-hidden rounded-(--r-sheet) outline-none sm:mb-0 sm:rounded-[1.75rem] ${
          open
            ? 'anim-sheet-up sm:anim-pop-in'
            : 'anim-sheet-down sm:anim-fade-out'
        }`}
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - 2.5rem)',
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : 'transform 0.45s var(--spring)',
          ['--sheet-y' as string]: `${dragY}px`,
        }}
      >
        <div
          className={`relative shrink-0 touch-none select-none px-5 pt-2.5 pb-3 ${dismissible ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={() => {
            dragRef.current = null
            setDragging(false)
            setDragY(0)
          }}
        >
          <div
            aria-hidden
            className="mx-auto mb-3.5 h-1.25 w-9 rounded-full bg-(--text-4) sm:hidden"
          />
          <h2 id={titleId} className="t-title3 m-0 px-11 py-2 text-center">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close sheet"
            disabled={!dismissible}
            onClick={onClose}
            className="absolute right-3 bottom-2 flex h-11 w-11 items-center justify-center rounded-full text-(--text-2) disabled:opacity-30"
          >
            <span className="glass flex h-8 w-8 items-center justify-center rounded-full">
              <IconXmark className="h-4 w-4" />
            </span>
          </button>
        </div>
        <div
          className="sheet-content min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:pb-5"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
            overscrollBehavior: 'contain',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
