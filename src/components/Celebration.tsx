import { useEffect, useEffectEvent } from 'react'

interface CelebrationProps {
  /** A milestone label starts the animation. Null hides it. */
  trigger: string | null
  /** Resolved CSS color (see `habitColor`). */
  color: string
  onDone: () => void
}

const PIECES = 18
const CONFETTI = ['var(--c-yellow)', 'var(--c-blue)', 'var(--c-pink)']

/** Show a milestone message and confetti for 2.6 seconds. */
export default function Celebration({ trigger, color, onDone }: CelebrationProps) {
  const finish = useEffectEvent(onDone)

  useEffect(() => {
    if (!trigger) return
    const t = window.setTimeout(() => finish(), 2600)
    return () => window.clearTimeout(t)
  }, [trigger])

  if (!trigger) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-60 overflow-hidden">
      {Array.from({ length: PIECES }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-2.5 w-1.5 rounded-sm"
          style={{
            left: `${(i * 100) / PIECES + 2}%`,
            background: i % 3 === 0 ? color : CONFETTI[i % CONFETTI.length],
            animation: `confetti-fall ${1.6 + (i % 5) * 0.25}s ease-in ${(i % 7) * 0.12}s both`,
          }}
        />
      ))}
      <div className="flex h-full items-center justify-center px-8">
        <div className="glass-strong anim-pop-in relative rounded-(--r-cell) px-8 py-6 text-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-(--r-cell)"
            style={{
              border: `2px solid ${color}`,
              animation: 'celebrate-ring 1.1s ease-out both',
            }}
          />
          <div className="text-4xl">🎉</div>
          <div className="t-title2 t-rounded mt-2">{trigger}</div>
          <div className="t-footnote mt-1 text-(--text-2)">
            Milestone reached.
          </div>
        </div>
      </div>
    </div>
  )
}
