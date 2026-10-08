import { describe, expect, it } from 'vitest'
import type { PlayRecord } from '../domain/stats'
import {
  MAX_RECORDS_PER_MODE,
  STORAGE_KEY,
  addChallengeRecord,
  addRecord,
  clearRecords,
  emptyData,
  loadData,
  parseData,
  saveData,
  setSound,
} from './records'

class MemoryStorage {
  private map = new Map<string, string>()
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
}

const rec = (timeMs: number): PlayRecord => ({ timeMs, mistakes: 0, playedAt: '2026-10-08T00:00:00.000Z' })

describe('保存と読み込み', () => {
  it('保存したものを読み込める', () => {
    const storage = new MemoryStorage()
    const data = setSound(addRecord(emptyData(), 'add1', rec(30000)), false)
    expect(saveData(data, storage)).toBe(true)
    expect(loadData(storage)).toEqual(data)
  })

  it('何も保存されていなければ初期値', () => {
    expect(loadData(new MemoryStorage())).toEqual(emptyData())
  })

  it('storage が使えなくても落ちない', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    }
    expect(loadData(broken)).toEqual(emptyData())
    expect(saveData(emptyData(), broken)).toBe(false)
    expect(loadData(null)).toEqual(emptyData())
  })
})

describe('記録の追加と削除', () => {
  it('上限をこえたら古いものから消す', () => {
    let data = emptyData()
    for (let i = 0; i < MAX_RECORDS_PER_MODE + 5; i++) data = addRecord(data, 'sub1', rec(i))
    const list = data.records.sub1!
    expect(list).toHaveLength(MAX_RECORDS_PER_MODE)
    expect(list[0].timeMs).toBe(5)
    expect(list[list.length - 1].timeMs).toBe(MAX_RECORDS_PER_MODE + 4)
  })

  it('九九の じゅんばん と ばらばら は別の記録', () => {
    let data = addRecord(emptyData(), 'kuku-3-seq', rec(1000))
    data = addRecord(data, 'kuku-3-rand', rec(2000))
    expect(data.records['kuku-3-seq']).toHaveLength(1)
    expect(data.records['kuku-3-rand']).toHaveLength(1)
  })

  it('モードごと・ぜんぶ 消せる', () => {
    let data = addRecord(addRecord(emptyData(), 'add1', rec(1)), 'add2', rec(2))
    data = clearRecords(data, { mode: 'add1', kind: 'practice' })
    expect(data.records.add1).toBeUndefined()
    expect(data.records.add2).toHaveLength(1)
    expect(clearRecords(data).records).toEqual({})
  })
})

describe('チャレンジの記録', () => {
  const ch = (correct: number) => ({ correct, mistakes: 1, playedAt: '2026-10-08T00:00:00.000Z' })

  it('れんしゅう とは別に保存・読み込みできる', () => {
    const storage = new MemoryStorage()
    let data = addRecord(emptyData(), 'add1', rec(30000))
    data = addChallengeRecord(data, 'add1', ch(12))
    saveData(data, storage)
    const loaded = loadData(storage)
    expect(loaded.records.add1).toHaveLength(1)
    expect(loaded.challenges.add1).toEqual([ch(12)])
  })

  it('チャレンジの記録だけを消せる。ぜんぶ消すと両方消える', () => {
    let data = addChallengeRecord(addRecord(emptyData(), 'add1', rec(1)), 'add1', ch(5))
    data = clearRecords(data, { mode: 'add1', kind: 'challenge' })
    expect(data.challenges.add1).toBeUndefined()
    expect(data.records.add1).toHaveLength(1)
    data = clearRecords(addChallengeRecord(data, 'sub2', ch(3)))
    expect(data.records).toEqual({})
    expect(data.challenges).toEqual({})
  })

  it('challenges がない古いデータも読める。おかしな記録とチャレンジのないモードは捨てる', () => {
    expect(parseData(JSON.stringify({ version: 1, records: {} })).challenges).toEqual({})
    const raw = JSON.stringify({
      version: 1,
      records: {},
      challenges: { add2: [ch(9), { correct: -1, mistakes: 0, playedAt: 'x' }], 'kuku-3-seq': [ch(1)] },
    })
    expect(parseData(raw).challenges).toEqual({ add2: [ch(9)] })
  })
})

describe('壊れたデータからの復旧', () => {
  it('JSON でなければ初期化', () => {
    expect(parseData('{broken')).toEqual(emptyData())
  })

  it('version がちがえば初期化', () => {
    expect(parseData(JSON.stringify({ version: 2, records: {} }))).toEqual(emptyData())
  })

  it('知らないモードとおかしな記録は捨て、正しい記録は残す', () => {
    const raw = JSON.stringify({
      version: 1,
      settings: { sound: 'yes' },
      records: {
        add1: [rec(1000), { timeMs: 'fast' }, { timeMs: -1, mistakes: 0, playedAt: 'x' }, null],
        unknown: [rec(1)],
        sub1: 'nope',
      },
    })
    const data = parseData(raw)
    expect(data.settings.sound).toBe(true)
    expect(data.records).toEqual({ add1: [rec(1000)] })
  })

  it('STORAGE_KEY に保存される', () => {
    const storage = new MemoryStorage()
    saveData(emptyData(), storage)
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()
  })
})
