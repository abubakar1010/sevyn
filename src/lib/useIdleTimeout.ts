import { useEffect } from 'react'

const EVENTS = [
  'mousemove',
  'keydown',
  'touchstart',
  'click',
  'scroll',
] as const

/** Calls `onIdle` after `ms` without user activity (default 10 minutes). */
export function useIdleTimeout(
  onIdle: () => void,
  ms = 10 * 60 * 1000,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return
    let timer = window.setTimeout(onIdle, ms)
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(onIdle, ms)
    }
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    return () => {
      window.clearTimeout(timer)
      EVENTS.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [onIdle, ms, enabled])
}
