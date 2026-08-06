import { useEffect, useRef, useState } from 'react'

interface CelebrationProps {
  /** Bump this key (e.g. milestone label) to trigger a celebration. */
  trigger: string | null
  color: string
  onDone: () => void
}

const PIECES = 18

/** Small celebratory moment when a milestone is crossed. */
export default function Celebration({ trigger, color, onDone }: CelebrationProps) {
  const [visible, setVisible] = useState(false)
  // Keep the latest callback in a ref so a parent re-render (the streak
  // counter ticks every second) doesn't restart the timeout below.
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!trigger) return
    setVisible(true)
    const t = window.setTimeout(() => {
      setVisible(false)
      onDoneRef.current()
    }, 2600)
    return () => window.clearTimeout(t)
  }, [trigger])

  if (!trigger || !visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {Array.from({ length: PIECES }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-2.5 w-1.5 rounded-sm"
          style={{
            left: `${(i * 100) / PIECES + 2}%`,
            background: i % 3 === 0 ? color : i % 3 === 1 ? '#FFB020' : '#4EA8FF',
            animation: `confetti-fall ${1.6 + (i % 5) * 0.25}s ease-in ${(i % 7) * 0.12}s both`,
          }}
        />
      ))}
      <div className="flex h-full items-center justify-center">
        <div className="glass anim-pop-in relative rounded-3xl px-8 py-6 text-center">
          <span
            className="absolute inset-0 rounded-3xl"
            style={{
              border: `2px solid ${color}`,
              animation: 'celebrate-ring 1.1s ease-out both',
            }}
          />
          <div className="text-4xl">🎉</div>
          <div className="mt-2 text-lg font-extrabold tracking-tight">
            {trigger}
          </div>
          <div className="mt-0.5 text-[0.8125rem] text-[var(--text-2)]">
            One moment at a time. You earned this.
          </div>
        </div>
      </div>
    </div>
  )
}
