export type KukuDan = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type KukuOrder = 'seq' | 'rand'

export type ModeId = 'add1' | 'sub1' | 'add2' | 'sub2' | `kuku-${KukuDan}-${KukuOrder}` | 'kuku-master'

export type ModeTheme = 'add' | 'sub' | 'kuku' | 'master'

export interface ModeInfo {
  id: ModeId
  title: string
  subtitle: string
  theme: ModeTheme
}

export const KUKU_DANS: readonly KukuDan[] = [2, 3, 4, 5, 6, 7, 8, 9]
export const KUKU_ORDERS: readonly KukuOrder[] = ['seq', 'rand']

export const KUKU_ORDER_LABEL: Record<KukuOrder, string> = {
  seq: 'じゅんばん',
  rand: 'ばらばら',
}

export function kukuModeId(dan: KukuDan, order: KukuOrder): ModeId {
  return `kuku-${dan}-${order}`
}

const BASIC_MODES: readonly ModeInfo[] = [
  { id: 'add1', title: 'たしざん ①', subtitle: 'くりあがり なし', theme: 'add' },
  { id: 'sub1', title: 'ひきざん ①', subtitle: 'くりさがり なし', theme: 'sub' },
  { id: 'add2', title: 'たしざん ②', subtitle: 'くりあがり あり', theme: 'add' },
  { id: 'sub2', title: 'ひきざん ②', subtitle: 'くりさがり あり', theme: 'sub' },
]

export const FIRST_GRADE_MODES: readonly ModeId[] = BASIC_MODES.map((m) => m.id)

const MASTER_MODE: ModeInfo = {
  id: 'kuku-master',
  title: 'くく マスター',
  subtitle: 'ぜんぶの だん から 20もん',
  theme: 'master',
}

const KUKU_MODES: readonly ModeInfo[] = KUKU_DANS.flatMap((dan) =>
  KUKU_ORDERS.map((order) => ({
    id: kukuModeId(dan, order),
    title: `${dan}の だん`,
    subtitle: KUKU_ORDER_LABEL[order],
    theme: 'kuku' as const,
  })),
)

export const ALL_MODES: readonly ModeInfo[] = [...BASIC_MODES, ...KUKU_MODES, MASTER_MODE]

const MODE_MAP = new Map<string, ModeInfo>(ALL_MODES.map((m) => [m.id, m]))

export function isModeId(value: string): value is ModeId {
  return MODE_MAP.has(value)
}

export function getModeInfo(id: ModeId): ModeInfo {
  const info = MODE_MAP.get(id)
  if (!info) throw new Error(`unknown mode: ${id}`)
  return info
}

export function parseKukuMode(id: ModeId): { dan: KukuDan; order: KukuOrder } | null {
  const m = /^kuku-([2-9])-(seq|rand)$/.exec(id)
  if (!m) return null
  return { dan: Number(m[1]) as KukuDan, order: m[2] as KukuOrder }
}
