interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<readonly [T, string]>
  value: T
  onChange: (value: T) => void
  'aria-label': string
  disabled?: boolean
}

/**
 * iOS segmented control: a capsule track with a sliding glass knob.
 * Announced as a radio group.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  disabled = false,
}: SegmentedControlProps<T>) {
  const index = Math.max(
    0,
    options.findIndex(([v]) => v === value),
  )

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="relative flex min-h-12 w-full rounded-full bg-[var(--fill-3)] p-0.5"
    >
      <span
        aria-hidden
        className="segment-thumb absolute top-0.5 bottom-0.5 left-0.5 rounded-full"
        style={{
          width: `calc((100% - 0.25rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
          transition: 'transform 0.4s var(--spring)',
        }}
      />
      {options.map(([v, label]) => {
        const selected = v === value
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(event) => {
              const direction =
                event.key === 'ArrowRight' || event.key === 'ArrowDown'
                  ? 1
                  : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                    ? -1
                    : 0
              if (!direction) return
              event.preventDefault()
              const next = (index + direction + options.length) % options.length
              onChange(options[next][0])
              const buttons =
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                  '[role="radio"]',
                )
              buttons?.[next].focus()
            }}
            onClick={() => onChange(v)}
            className="t-subhead relative z-10 flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-full px-[8px] py-1.5 text-center font-medium transition-colors duration-200"
            style={{ color: selected ? 'var(--text)' : 'var(--text-2)' }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
