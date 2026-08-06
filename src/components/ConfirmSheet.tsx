import Sheet from './Sheet'

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

/** Custom confirm dialog — never native confirm(). */
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
  return (
    <Sheet open={open} onClose={onClose} title={title} dismissible={!busy}>
      <p className="mb-5 text-center text-[0.9375rem] leading-relaxed text-[var(--text-2)]">
        {message}
      </p>
      {error ? (
        <p
          role="alert"
          className="mb-3 rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-center text-[0.8125rem] font-medium text-[var(--danger)]"
        >
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="press w-full rounded-2xl py-3.5 text-[0.9375rem] font-bold text-white disabled:opacity-50"
          style={{
            background: danger ? 'var(--danger)' : 'var(--accent)',
          }}
        >
          {busy ? 'One moment…' : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="press w-full rounded-2xl bg-[var(--field-bg)] py-3.5 text-[0.9375rem] font-semibold text-[var(--text)]"
        >
          {cancelLabel}
        </button>
      </div>
    </Sheet>
  )
}
