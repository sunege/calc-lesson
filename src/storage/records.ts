import { isChallengeMode, type ChallengeModeId, type ChallengeRecord } from '../domain/challenge'
import { isModeId, type ModeId } from '../domain/modes'
import type { PlayRecord } from '../domain/stats'

export const STORAGE_KEY = 'calc-lesson:v1'
export const MAX_RECORDS_PER_MODE = 100

export interface Settings {
  sound: boolean
}

export interface StoredData {
  version: 1
  settings: Settings
  /** れんしゅう の記録(クリアタイム) */
  records: Partial<Record<ModeId, PlayRecord[]>>
  /** チャレンジ の記録(1ぷんで といた数) */
  challenges: Partial<Record<ChallengeModeId, ChallengeRecord[]>>
}

/** どちらの記録か */
export type RecordKind = 'practice' | 'challenge'

export function emptyData(): StoredData {
  return { version: 1, settings: { sound: true }, records: {}, challenges: {} }
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function defaultStorage(): StorageLike | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** localStorage に読み書きできるかを確かめる(プライベートブラウズなどでは失敗する) */
export function isStorageAvailable(storage: StorageLike | null = defaultStorage()): boolean {
  if (!storage) return false
  try {
    const probe = `${STORAGE_KEY}:probe`
    storage.setItem(probe, '1')
    ;(storage as Partial<Storage>).removeItem?.(probe)
    return true
  } catch {
    return false
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function isPlayRecord(v: unknown): v is PlayRecord {
  return (
    isObject(v) &&
    typeof v.timeMs === 'number' &&
    Number.isFinite(v.timeMs) &&
    v.timeMs >= 0 &&
    typeof v.mistakes === 'number' &&
    Number.isInteger(v.mistakes) &&
    v.mistakes >= 0 &&
    typeof v.playedAt === 'string'
  )
}

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0

function isChallengeRecord(v: unknown): v is ChallengeRecord {
  return isObject(v) && isCount(v.correct) && isCount(v.mistakes) && typeof v.playedAt === 'string'
}

/** 壊れている部分は捨てて、読める部分だけを取り出す */
export function parseData(raw: string | null): StoredData {
  if (raw === null) return emptyData()
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return emptyData()
  }
  if (!isObject(json) || json.version !== 1) return emptyData()

  const data = emptyData()
  if (isObject(json.settings) && typeof json.settings.sound === 'boolean') {
    data.settings.sound = json.settings.sound
  }
  if (isObject(json.records)) {
    for (const [mode, list] of Object.entries(json.records)) {
      if (!isModeId(mode) || !Array.isArray(list)) continue
      const valid = list.filter(isPlayRecord).slice(-MAX_RECORDS_PER_MODE)
      if (valid.length > 0) data.records[mode] = valid
    }
  }
  // challenges は あとから ふえた項目なので、ない場合は空のままにする
  if (isObject(json.challenges)) {
    for (const [mode, list] of Object.entries(json.challenges)) {
      if (!isModeId(mode) || !isChallengeMode(mode) || !Array.isArray(list)) continue
      const valid = list.filter(isChallengeRecord).slice(-MAX_RECORDS_PER_MODE)
      if (valid.length > 0) data.challenges[mode] = valid
    }
  }
  return data
}

export function loadData(storage: StorageLike | null = defaultStorage()): StoredData {
  if (!storage) return emptyData()
  try {
    return parseData(storage.getItem(STORAGE_KEY))
  } catch {
    return emptyData()
  }
}

/** 保存できたら true */
export function saveData(data: StoredData, storage: StorageLike | null = defaultStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function addRecord(data: StoredData, mode: ModeId, record: PlayRecord): StoredData {
  const list = [...(data.records[mode] ?? []), record].slice(-MAX_RECORDS_PER_MODE)
  return { ...data, records: { ...data.records, [mode]: list } }
}

export function addChallengeRecord(data: StoredData, mode: ChallengeModeId, record: ChallengeRecord): StoredData {
  const list = [...(data.challenges[mode] ?? []), record].slice(-MAX_RECORDS_PER_MODE)
  return { ...data, challenges: { ...data.challenges, [mode]: list } }
}

/** target を省略すると、れんしゅう・チャレンジ の記録をすべて消す */
export function clearRecords(data: StoredData, target?: { mode: ModeId; kind: RecordKind }): StoredData {
  if (!target) return { ...data, records: {}, challenges: {} }
  if (target.kind === 'challenge') {
    const challenges = { ...data.challenges }
    if (isChallengeMode(target.mode)) delete challenges[target.mode]
    return { ...data, challenges }
  }
  const records = { ...data.records }
  delete records[target.mode]
  return { ...data, records }
}

export function setSound(data: StoredData, sound: boolean): StoredData {
  return { ...data, settings: { ...data.settings, sound } }
}
