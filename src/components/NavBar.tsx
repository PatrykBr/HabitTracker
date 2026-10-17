import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface NavBarProps {
  title: string
  /** Subtitle below the large title, such as a greeting or count. */
  subtitle?: string
  leading?: ReactNode
  trailing?: ReactNode
}

/**
 * Keep navigation controls fixed above the content. Show the inline title
 * after the large title scrolls beneath them. Include top safe-area spacing.
 */
export default function NavBar({
  title,
  subtitle,
  leading,
  trailing,
}: NavBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const largeTitleRef = useRef<HTMLHeadingElement>(null)
  const [inlineVisible, setInlineVisible] = useState(false)

  useEffect(() => {
    const target = largeTitleRef.current
    const bar = barRef.current
    if (!target || !bar) return
    // The inline title appears once the large title is hidden under the bar.
    const observer = new IntersectionObserver(
      ([entry]) => setInlineVisible(!entry.isIntersecting),
      { rootMargin: `-${bar.offsetHeight}px 0px 0px 0px`, threshold: 0 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div className="scroll-edge scroll-edge-top z-30" aria-hidden />
      <div
        ref={barRef}
        className="pointer-events-none fixed inset-x-0 top-0 z-40 safe-top"
      >
        <div className="mx-auto flex h-13 w-full max-w-lg items-center justify-between gap-2 px-4 safe-x">
          <div className="flex min-w-11 items-center gap-2 *:pointer-events-auto">
            {leading}
          </div>
          <div
            className="t-headline min-w-0 flex-1 truncate text-center transition-opacity duration-200"
            style={{ opacity: inlineVisible ? 1 : 0 }}
            aria-hidden={!inlineVisible}
          >
            {title}
          </div>
          <div className="flex min-w-11 items-center justify-end gap-2 *:pointer-events-auto">
            {trailing}
          </div>
        </div>
      </div>
      {/* Reserve the bar's height in the flow. */}
      <div className="h-13 safe-top" aria-hidden />
      <div className="anim-rise-in px-1 pt-1 pb-3">
        <h1 ref={largeTitleRef} className="t-large-title m-0">
          {title}
        </h1>
        {subtitle ? (
          <p className="t-subhead m-0 mt-0.5 text-(--text-2)">{subtitle}</p>
        ) : null}
      </div>
    </>
  )
}
