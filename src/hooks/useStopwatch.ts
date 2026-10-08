import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * running が true のあいだだけ時間が進むストップウォッチ。
 * アプリが裏に回っている(タブが見えない)あいだも止める。
 */
export function useStopwatch(running: boolean, tickMs = 250) {
  const accumulated = useRef(0)
  const startedAt = useRef<number | null>(null)
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden')
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  const active = running && visible

  const elapsed = useCallback(
    () => accumulated.current + (startedAt.current === null ? 0 : performance.now() - startedAt.current),
    [],
  )

  // 画面の更新と同じタイミングで止めたり動かしたりして、ずれを小さくする
  useLayoutEffect(() => {
    if (!active) return
    startedAt.current = performance.now()
    return () => {
      if (startedAt.current !== null) accumulated.current += performance.now() - startedAt.current
      startedAt.current = null
      setDisplay(accumulated.current)
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setDisplay(elapsed()), tickMs)
    return () => window.clearInterval(id)
  }, [active, elapsed, tickMs])

  return { elapsed, display }
}
