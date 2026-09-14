import type { Card, Mode } from '../types'

/** 参加者の表示名。名前が未設定なら汎用ラベルにフォールバック */
export function participants(mode: Mode, names: [string, string], friends: string[]): string[] {
  if (mode === 'couple') return [names[0] || 'あなた', names[1] || '相手']
  const list = friends.map((n) => n.trim()).filter(Boolean)
  if (list.length < 2) return ['あなた', '相手']
  // 同名がいると指名や集計で区別できないので番号を付ける
  const count = new Map<string, number>()
  return list.map((n) => {
    const k = (count.get(n) ?? 0) + 1
    count.set(n, k)
    return k === 1 ? n : `${n}${k}`
  })
}

export interface Turn {
  /** 最初に答える / 指名された人 */
  first: string
  /** thanks / wish の相手 */
  second: string
}

/**
 * カードごとに「誰の番か」を先に決めておく。
 * 恋人モードは交互、友達モードはランダム（直前と同じ人は避ける）。
 */
export function assignTurns(mode: Mode, people: string[], queue: Card[]): Turn[] {
  const turns: Turn[] = []
  let prev = -1
  for (let i = 0; i < queue.length; i++) {
    let a: number
    if (mode === 'couple') a = i % 2
    else {
      const choices = people.map((_, k) => k).filter((k) => k !== prev || people.length < 2)
      a = choices[Math.floor(Math.random() * choices.length)]
    }
    const others = people.map((_, k) => k).filter((k) => k !== a)
    const b = others.length ? others[Math.floor(Math.random() * others.length)] : a
    turns.push({ first: people[a], second: people[b] })
    prev = a
  }
  return turns
}
