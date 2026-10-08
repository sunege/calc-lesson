import type { CSSProperties } from 'react'
import styles from './RecordChart.module.css'

export interface ChartGuide {
  value: number
  label: string
}

interface Props {
  /** 古い順。最後の値を「こんかい」として強調する */
  values: readonly number[]
  /** 小さいほど よい(タイム)か、大きいほど よい(といた数)か */
  better: 'lower' | 'higher'
  /** ぼう の 上に出す数字。[数, たんい] を 1行ずつ */
  labelLines: (value: number) => [number, string][]
  /** たて軸の目もりの文字 */
  tickLabel: (value: number) => string
  /** 目もりの間隔の候補(小さい順) */
  tickSteps: readonly number[]
  maxBars?: number
  /** よこに引く 目じるし(ランクの さかいめ など)。右はしに label を出す */
  guides?: readonly ChartGuide[]
  ariaLabel: string
}

/** ぼう 1本ぶんの はば */
const SLOT = 72
const H = 360
const M = { top: 92, bottom: 60, left: 128 }
const PLOT_H = H - M.top - M.bottom
/** 2行の ラベル の 行の高さ */
const LINE = 22
/** 目じるしの ラベルどうしの さいていの間隔 */
const GUIDE_LABEL_GAP = 32

/** 目もりが 5本以下になる、きりのよい間隔と上限を決める */
function niceScale(max: number, steps: readonly number[]) {
  const step = steps.find((s) => max / s <= 5) ?? Math.ceil(max / 5)
  const top = Math.max(step, Math.ceil(max / step) * step)
  return { step, top }
}

interface ValueLabelProps {
  x: number
  /** いちばん下の行の位置 */
  y: number
  lines: [number, string][]
  className: string
  style?: CSSProperties
}

function ValueLabel({ x, y, lines, className, style }: ValueLabelProps) {
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

/** これまでの記録の ぼうグラフ */
export function RecordChart({
  values,
  better,
  labelLines,
  tickLabel,
  tickSteps,
  maxBars = 10,
  guides = [],
  ariaLabel,
}: Props) {
  if (values.length === 0) return null

  const right = guides.length > 0 ? 48 : 16
  const W = M.left + right + SLOT * maxBars
  const offset = Math.max(0, values.length - maxBars)
  const visible = values.slice(offset)
  const best = better === 'lower' ? Math.min(...values) : Math.max(...values)
  const bestIndex = values.indexOf(best)
  const latestIndex = values.length - 1

  // つぎの目じるし(まだ とどいていない いちばん下のもの)までは グラフに入れて、目標が見えるようにする
  const dataMax = Math.max(...visible, best)
  const nextGuide = guides.map((g) => g.value).find((v) => v > dataMax)
  const { step, top } = niceScale(Math.max(dataMax * 1.08, nextGuide ?? 0, 1), tickSteps)
  const y = (v: number) => M.top + PLOT_H - (v / top) * PLOT_H
  const barW = SLOT * 0.62
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step)
  const shownGuides = guides.filter((g) => g.value > 0 && g.value <= top)
  // ラベルどうしが重ならないように、上から順に 間があいているものだけ ラベルを出す
  const labeledGuides = new Set<number>()
  let lastLabelY = -Infinity
  for (const g of [...shownGuides].sort((a, b) => b.value - a.value)) {
    if (y(g.value) - lastLabelY >= GUIDE_LABEL_GAP) {
      labeledGuides.add(g.value)
      lastLabelY = y(g.value)
    }
  }

  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      {/* よこ線と目もり */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.left} x2={W - right} y1={y(t)} y2={y(t)} className={styles.grid} />
          <text x={M.left - 10} y={y(t)} className={styles.tick} textAnchor="end" dominantBaseline="middle">
            {t === 0 ? '0' : tickLabel(t)}
          </text>
        </g>
      ))}

      {/* 目じるし */}
      {shownGuides.map((g) => {
        const reached = best >= g.value
        return (
          <g key={g.value}>
            <line
              x1={M.left}
              x2={W - right}
              y1={y(g.value)}
              y2={y(g.value)}
              className={`${styles.guide} ${reached ? styles.guideReached : ''}`}
            />
            {labeledGuides.has(g.value) && (
              <text
                x={W - right / 2}
                y={y(g.value)}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`${styles.guideLabel} ${reached ? '' : styles.guideLabelDim}`}
              >
                {g.label}
              </text>
            )}
          </g>
        )
      })}

      {/* ぼう */}
      {visible.map((v, i) => {
        const index = offset + i
        const isLatest = index === latestIndex
        const isBest = index === bestIndex
        const x = M.left + SLOT * i + (SLOT - barW) / 2
        const cx = x + barW / 2
        const barTop = y(v)
        const lines = labelLines(v)
        const labelBottom = barTop - 8
        const labelTop = labelBottom - (lines.length - 1) * LINE - 16
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
            <ValueLabel
              x={cx}
              y={labelBottom}
              lines={lines}
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
      <line x1={M.left} x2={W - right} y1={y(best)} y2={y(best)} className={styles.bestLine} />

      <line x1={M.left} x2={W - right} y1={M.top + PLOT_H} y2={M.top + PLOT_H} className={styles.axis} />
      <text x={M.left - 10} y={H - M.bottom + 26} className={styles.axisLabel} textAnchor="end">
        かいめ
      </text>
    </svg>
  )
}
