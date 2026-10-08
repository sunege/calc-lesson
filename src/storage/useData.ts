import { createContext, useContext } from 'react'
import type { ChallengeModeId, ChallengeRecord } from '../domain/challenge'
import type { ModeId } from '../domain/modes'
import type { PlayRecord } from '../domain/stats'
import type { RecordKind, StoredData } from './records'

export interface DataContextValue {
  data: StoredData
  storageAvailable: boolean
  addRecord: (mode: ModeId, record: PlayRecord) => void
  addChallengeRecord: (mode: ChallengeModeId, record: ChallengeRecord) => void
  /** target を省略すると、すべての記録を消す */
  clearRecords: (target?: { mode: ModeId; kind: RecordKind }) => void
  setSound: (sound: boolean) => void
}

export const DataContext = createContext<DataContextValue | null>(null)

export function useData(): DataContextValue {
  const value = useContext(DataContext)
  if (!value) throw new Error('useData must be used inside DataProvider')
  return value
}
