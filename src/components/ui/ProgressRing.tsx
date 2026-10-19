import { useCountUp } from '@/lib/useCountUp'

/** Circular progress that draws itself in; `percent` is 0 to 100. */
export function ProgressRing({
  percent,
  label,
}: {
  percent: number
  label: string
}) {
  const size = 132
  const stroke = 11
  const r = (size - stroke) / 2
  const length = 2 * Math.PI * r
  const shown = useCountUp(percent, 1100)
  return (
    <div
      className="relative size-33 shrink-0"
      role="img"
      aria-label={`${label}: ${percent}%`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="white"
          strokeOpacity="0.18"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - percent / 100)}
          style={{
            ['--ring-length' as string]: length,
            animation: 'ring-draw 1.2s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        />
      </svg>
      <div
        aria-hidden
        className="absolute inset-0 flex flex-col items-center justify-center text-white"
      >
        <span className="font-display text-3xl leading-none font-semibold">
          {shown}%
        </span>
        <span className="mt-1 text-[0.65rem] tracking-wider uppercase opacity-80">
          {label}
        </span>
      </div>
    </div>
  )
}
