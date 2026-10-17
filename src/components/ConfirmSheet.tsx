import Sheet from './Sheet'
import { onColor } from '../lib/color'
import { useOnline } from '../lib/hooks'

interface ConfirmSheetProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  /** Shown when the confirmed action failed, so the user can retry. */
  error?: string | null
}

/** Confirmation sheet (iOS action-sheet pattern) — never native confirm(). */
export default function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  error = null,
}: ConfirmSheetProps) {
  const online = useOnline()
  const color = danger ? 'var(--danger)' : 'var(--accent)'
  return (
    <Sheet open={open} onClose={onClose} title={title} dismissible={!busy}>
      <p className="t-subhead mx-2 mt-0 mb-5 text-center text-(--text-2)">
        {message}
      </p>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy || !online}
          onClick={onConfirm}
          className="btn btn-filled"
          style={{
            ['--tint' as string]: color,
            ['--on-tint' as string]: onColor(color),
          }}
        >
          {busy ? 'One moment…' : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="btn btn-gray"
        >
          {cancelLabel}
        </button>
      </div>
    </Sheet>
  )
}

/** Inline error for forms and confirmations. */
export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="t-footnote mx-1 mt-0 mb-3 rounded-(--r-inner) px-3.5 py-2.5 font-medium text-(--danger-text)"
      style={{
        background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
      }}
    >
      {children}
    </p>
  )
}
