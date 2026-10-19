import { useEffect, useState } from 'react'

const canAnimate = () =>
  typeof requestAnimationFrame === 'function' &&
  !(
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

/** Eases a number up from 0 to `target`. Returns `target` straight away when motion is reduced. */
export function useCountUp(target: number, ms = 900) {
  const animate = canAnimate()
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!animate) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animate, target, ms])
  return animate ? value : target
}
