import type { ReactNode } from 'react'
import { IconChevronRight } from './Icons'

interface GroupProps {
  title?: string
  footer?: ReactNode
  children: ReactNode
}

/**
 * Inset grouped list section: Title-Case header, a borderless 26pt-radius
 * cell holding rows with hairline separators, optional footnote.
 */
export function Group({
  title,
  footer,
  children,
}: GroupProps) {
  return (
    <section>
      {title ? <h2 className="section-title">{title}</h2> : null}
      <div className="cell rows overflow-hidden">{children}</div>
      {footer ? <p className="section-footer">{footer}</p> : null}
    </section>
  )
}

interface RowProps {
  children: ReactNode
  className?: string
}

/** Form row. Navigation rows use a typed Link directly. */
export function Row({ children, className = '' }: RowProps) {
  return <div className={`row text-(--text) ${className}`}>{children}</div>
}

/** Disclosure indicator for navigation rows. */
export function Chevron() {
  return <IconChevronRight className="h-4 w-4 shrink-0 text-(--text-3)" />
}
