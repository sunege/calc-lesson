import type { PlayRecord } from '../domain/stats'
import styles from './TimeChart.module.css'

interface Props {
  /** 古い順。最後の要素を「こんかい」として強調する */
  records: readonly PlayRecord[]
  maxBars?: number
}

const W = 640
const H = 320
const M = { top: 48, right: 16, bottom: 52, left: 56 }
const PLOT_W = W - M.left - M.right
const PLOT_H = H - M.top - M.bottom

const TICK_STEPS_SEC = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600]

/** 目もりが 5本以下になる、きりのよい間隔と上限を決める */
function niceScale(maxSec: number) {
  const step = TICK_STEPS_SEC.find((s) => maxSec / s <= 5) ?? Math.ceil(maxSec / 5)
  const top = Math.max(step, Math.ceil(maxSec / step) * step)
  return { step, top }
}

// formatTime と同じく 0.1 秒未満は切り捨てる
const fmtSec = (ms: number) => (Math.floor(ms / 100) / 10).toFixed(1)

export function TimeChart({ records, maxBars = 10 }: Props) {
  if (records.length === 0) return null

  const offset = Math.max(0, records.length - maxBars)
  const visible = records.slice(offset)
  const bestMs = Math.min(...records.map((r) => r.timeMs))
  const bestIndex = records.findIndex((r) => r.timeMs === bestMs)
  const latestIndex = records.length - 1

  const { step, top } = niceScale((Math.max(...visible.map((r) => r.timeMs), bestMs) / 1000) * 1.08)
  const y = (ms: number) => M.top + PLOT_H - (ms / 1000 / top) * PLOT_H
  const slot = PLOT_W / maxBars
  const barW = slot * 0.62
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step)

  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="これまでの タイム の グラフ">
      {/* よこ線と目もり */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.left} x2={W - M.right} y1={y(t * 1000)} y2={y(t * 1000)} className={styles.grid} />
          <text x={M.left - 10} y={y(t * 1000)} className={styles.tick} textAnchor="end" dominantBaseline="middle">
            {t}
          </text>
        </g>
      ))}
      <text x={M.left - 10} y={M.top - 22} className={styles.axisLabel} textAnchor="end">
        びょう
      </text>

      {/* ぼう */}
      {visible.map((r, i) => {
        const index = offset + i
        const isLatest = index === latestIndex
        const isBest = index === bestIndex
        const x = M.left + slot * i + (slot - barW) / 2
        const barTop = y(r.timeMs)
        const delay = isLatest ? 0.5 : i * 0.05
        return (
          <g key={index}>
            <rect
              x={x}
              y={barTop}
              width={barW}
              height={M.top + PLOT_H - barTop}
              rx={8}
              className={`${styles.bar} ${isLatest ? styles.latest : ''} ${isBest ? styles.best : ''}`}
              style={{ animationDelay: `${delay}s` }}
            />
            <text
              x={x + barW / 2}
              y={barTop - 8}
              className={`${styles.value} ${isLatest ? styles.valueLatest : ''}`}
              textAnchor="middle"
              style={{ animationDelay: `${delay + 0.4}s` }}
            >
              {fmtSec(r.timeMs)}
            </text>
            {isBest && (
              <text
                x={x + barW / 2}
                y={barTop - 30}
                className={styles.crown}
                textAnchor="middle"
                style={{ animationDelay: `${delay + 0.5}s` }}
              >
                👑
              </text>
            )}
            <text x={x + barW / 2} y={H - M.bottom + 24} className={styles.xLabel} textAnchor="middle">
              {index + 1}
            </text>
            {isLatest && (
              <text x={x + barW / 2} y={H - M.bottom + 46} className={styles.nowLabel} textAnchor="middle">
                こんかい
              </text>
            )}
          </g>
        )
      })}

      {/* じこベストの点線 */}
      <line x1={M.left} x2={W - M.right} y1={y(bestMs)} y2={y(bestMs)} className={styles.bestLine} />

      <line x1={M.left} x2={W - M.right} y1={M.top + PLOT_H} y2={M.top + PLOT_H} className={styles.axis} />
      <text x={M.left - 10} y={H - M.bottom + 24} className={styles.axisLabel} textAnchor="end">
        かいめ
      </text>
    </svg>
  )
}
