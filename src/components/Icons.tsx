import type { SVGProps } from 'react'

/**
 * SF Symbols–style glyphs (24pt grid, 2pt strokes). Tab icons come in an
 * outline and a filled variant like iOS: filled when selected.
 */

type IconProps = SVGProps<SVGSVGElement> & { filled?: boolean }

function base(props: IconProps, filled: boolean) {
  const { filled: _f, className, ...rest } = props
  return {
    viewBox: '0 0 24 24',
    width: 24,
    height: 24,
    'aria-hidden': true,
    fill: filled ? 'currentColor' : 'none',
    stroke: filled ? 'none' : 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    ...rest,
  }
}

export function IconHouse(props: IconProps) {
  const filled = props.filled ?? false
  return (
    <svg {...base(props, filled)}>
      {filled ? (
        <path d="M11.3 2.9a1 1 0 0 1 1.4 0l8 7.3c.2.2.3.5.3.7V20a2 2 0 0 1-2 2h-4.5a.5.5 0 0 1-.5-.5V16a2 2 0 0 0-4 0v5.5a.5.5 0 0 1-.5.5H5a2 2 0 0 1-2-2v-9.1c0-.3.1-.5.3-.7z" />
      ) : (
        <>
          <path d="M3 11 12 3l9 8" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
        </>
      )}
    </svg>
  )
}

export function IconPerson(props: IconProps) {
  const filled = props.filled ?? false
  return (
    <svg {...base(props, filled)}>
      {filled ? (
        <>
          <circle cx="12" cy="7.5" r="4.5" />
          <path d="M3.5 20.2c1.4-4 4.7-6.2 8.5-6.2s7.1 2.2 8.5 6.2c.2.7-.3 1.3-1 1.3h-15c-.7 0-1.2-.6-1-1.3z" />
        </>
      ) : (
        <>
          <circle cx="12" cy="7.5" r="4" />
          <path d="M4 21c1.5-3.8 4.5-5.8 8-5.8s6.5 2 8 5.8" />
        </>
      )}
    </svg>
  )
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props, false)} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconReset(props: IconProps) {
  return (
    <svg {...base(props, false)}>
      <path d="M4 10a8 8 0 1 1 1.6 7.2M4 4v6h6" />
    </svg>
  )
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...base(props, false)} strokeWidth={2.4}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base(props, false)} strokeWidth={2.4}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function IconXmark(props: IconProps) {
  return (
    <svg {...base(props, false)} strokeWidth={2.2}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props, false)} strokeWidth={2.6}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
