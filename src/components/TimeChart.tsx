import type { CSSProperties } from 'react'
import { formatTime, minuteUnit, timeParts, type PlayRecord } from '../domain/stats'
import styles from './TimeChart.module.css'

interface Props {
  /** 古い順。最後の要素を「こんかい」として強調する */
  records: readonly PlayRecord[]
  maxBars?: number
}

/** ぼう 1本ぶんの はば */
const SLOT = 72
const H = 360
const M = { top: 92, right: 16, bottom: 60, left: 128 }
const PLOT_H = H - M.top - M.bottom
/** 2行の ラベル の 行の高さ */
const LINE = 22

const TICK_STEPS_SEC = [1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600]

/** 目もりが 5本以下になる、きりのよい間隔と上限を決める */
function niceScale(maxSec: number) {
  const step = TICK_STEPS_SEC.find((s) => maxSec / s <= 5) ?? Math.ceil(maxSec / 5)
  const top = Math.max(step, Math.ceil(maxSec / step) * step)
  return { step, top }
}

/** 「2ふん」「15びょう」のように、1行ずつに分ける */
function labelLines(ms: number): [number, string][] {
  const { minutes, seconds } = timeParts(ms)
  if (minutes === 0) return [[seconds, 'びょう']]
  if (seconds === 0) return [[minutes, minuteUnit(minutes)]]
  return [
    [minutes, minuteUnit(minutes)],
    [seconds, 'びょう'],
  ]
}

interface TimeLabelProps {
  x: number
  /** いちばん下の行の位置 */
  y: number
  ms: number
  className: string
  style?: CSSProperties
}

/** ぼう の 上に出す タイム。1分をこえたら「○ふん」「○びょう」の2行にする */
function TimeLabel({ x, y, ms, className, style }: TimeLabelProps) {
  const lines = labelLines(ms)
  return (
    <text x={x} y={y - (lines.length - 1) * LINE} textAnchor="middle" className={className} style={style}>
      {lines.map(([n, unit], i) => (
        <tspan key={unit} x={x} dy={i === 0 ? 0 : LINE}>
          {n}
          <tspan className={styles.unit}>{unit}</tspan>
        </tspan>
      ))}
    </text>
  )
}

export function TimeChart({ records, maxBars = 10 }: Props) {
  if (records.length === 0) return null

  const W = M.left + M.right + SLOT * maxBars
  const offset = Math.max(0, records.length - maxBars)
  const visible = records.slice(offset)
  const bestMs = Math.min(...records.map((r) => r.timeMs))
  const bestIndex = records.findIndex((r) => r.timeMs === bestMs)
  const latestIndex = records.length - 1

  const { step, top } = niceScale((Math.max(...visible.map((r) => r.timeMs), bestMs) / 1000) * 1.08)
  const y = (ms: number) => M.top + PLOT_H - (ms / 1000 / top) * PLOT_H
  const barW = SLOT * 0.62
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step)

  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="これまでの タイム の グラフ">
      {/* よこ線と目もり */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.left} x2={W - M.right} y1={y(t * 1000)} y2={y(t * 1000)} className={styles.grid} />
          <text x={M.left - 10} y={y(t * 1000)} className={styles.tick} textAnchor="end" dominantBaseline="middle">
            {t === 0 ? '0' : formatTime(t * 1000)}
          </text>
        </g>
      ))}

      {/* ぼう */}
      {visible.map((r, i) => {
        const index = offset + i
        const isLatest = index === latestIndex
        const isBest = index === bestIndex
        const x = M.left + SLOT * i + (SLOT - barW) / 2
        const cx = x + barW / 2
        const barTop = y(r.timeMs)
        const labelBottom = barTop - 8
        const labelTop = labelBottom - (labelLines(r.timeMs).length - 1) * LINE - 16
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
            <TimeLabel
              x={cx}
              y={labelBottom}
              ms={r.timeMs}
              className={`${styles.value} ${isLatest ? styles.valueLatest : ''}`}
              style={{ animationDelay: `${delay + 0.4}s` }}
            />
            {isBest && (
              <text
                x={cx}
                y={labelTop - 6}
                className={styles.crown}
                textAnchor="middle"
                style={{ animationDelay: `${delay + 0.5}s` }}
              >
                👑
              </text>
            )}
            <text x={cx} y={H - M.bottom + 26} className={styles.xLabel} textAnchor="middle">
              {index + 1}
            </text>
            {isLatest && (
              <text x={cx} y={H - M.bottom + 52} className={styles.nowLabel} textAnchor="middle">
                こんかい
              </text>
            )}
          </g>
        )
      })}

      {/* じこベストの点線 */}
      <line x1={M.left} x2={W - M.right} y1={y(bestMs)} y2={y(bestMs)} className={styles.bestLine} />

      <line x1={M.left} x2={W - M.right} y1={M.top + PLOT_H} y2={M.top + PLOT_H} className={styles.axis} />
      <text x={M.left - 10} y={H - M.bottom + 26} className={styles.axisLabel} textAnchor="end">
        かいめ
      </text>
    </svg>
  )
}
