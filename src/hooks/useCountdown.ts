import { useEffect, useEffectEvent, useRef } from 'react'
import { useStopwatch } from './useStopwatch'

interface Options {
  /** 時間ぎれになったとき */
  onExpire: () => void
  /** のこり秒数(切り上げ)が かわったとき */
  onSecond?: (secondsLeft: number) => void
}

/**
 * 制限時間つきのタイマー。running が true のあいだだけ時間がへる
 * (アプリが裏に回っているあいだも止まる)。
 */
export function useCountdown(limitMs: number, running: boolean, { onExpire, onSecond }: Options) {
  const { elapsed, display, active } = useStopwatch(running, 100)
  const lastSecond = useRef(Math.ceil(limitMs / 1000))

  const expire = useEffectEvent(onExpire)
  const tick = useEffectEvent(() => {
    const sec = Math.ceil(Math.max(0, limitMs - elapsed()) / 1000)
    if (sec !== lastSecond.current) {
      lastSecond.current = sec
      onSecond?.(sec)
    }
  })

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => expire(), Math.max(0, limitMs - elapsed()))
    const id = window.setInterval(() => tick(), 50)
    return () => {
      window.clearTimeout(t)
      window.clearInterval(id)
    }
  }, [active, limitMs, elapsed])

  return { remainingMs: Math.max(0, limitMs - display) }
}
