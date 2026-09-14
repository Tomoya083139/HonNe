export type Mode = 'couple' | 'friends'
export type Level = 1 | 2 | 3 | 4
export type CardType =
  | 'open' // オープン質問
  | 'choice' // 二択・三択
  | 'guess' // 当てっこ
  | 'reveal' // せーの（同時公開）
  | 'scale' // 10点満点
  | 'thanks' // 感謝を伝える
  | 'wish' // お願い・約束
  | 'action' // ちょいミッション

export interface LText {
  ja: string
  en: string
}

export interface Card {
  id: string
  type: CardType
  level: Level
  themes: string[]
  text: LText
  /** choice 型の選択肢 */
  options?: LText[]
  /** action 型のタイマー秒数 */
  seconds?: number
  rating?: 'all' | '16+'
}

export interface Deck {
  id: string
  mode: Mode
  name: LText
  tagline: LText
  color: string
  themes: string[]
  cards: Card[]
}

export interface SessionConfig {
  deckId: string
  themes: string[]
  levels: Level[]
  count: number // 0 = 無制限
  gradient: boolean // ライト→ディープの順に並べる
}

export interface AnswerRecord {
  cardId: string
  deckId: string
  at: string // ISO
  memo?: string
  values?: string[] // reveal / scale / choice の回答
  result?: 'hit' | 'miss' // guess の結果
}

export interface SessionRecord {
  id: string
  deckId: string
  mode: Mode
  startedAt: string
  endedAt?: string
  answered: number
  passed: number
  hits: number
  misses: number
}
