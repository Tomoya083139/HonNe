import type { LText, Mode } from '../types'

export const THEMES: Record<string, LText> = {
  values: { ja: '価値観', en: 'Values' },
  love: { ja: '恋愛観', en: 'Love' },
  past: { ja: '過去・思い出', en: 'Past' },
  future: { ja: '将来', en: 'Future' },
  daily: { ja: '日常', en: 'Daily life' },
  money: { ja: 'お金・仕事', en: 'Money & work' },
  family: { ja: '家族', en: 'Family' },
  intimacy: { ja: '親密さ', en: 'Intimacy' },
  feelings: { ja: 'いまの気持ち', en: 'Feelings' },
  gratitude: { ja: '感謝', en: 'Gratitude' },
  fun: { ja: 'ネタ・妄想', en: 'Just for fun' },
  work: { ja: '仕事・学校', en: 'Work & school' },
  icebreak: { ja: 'アイスブレイク', en: 'Icebreaker' },
  friendship: { ja: '友情', en: 'Friendship' },
  romance: { ja: '恋バナ', en: 'Love talk' },
  life: { ja: '人生', en: 'Life' },
}

export const MODE_LABEL: Record<Mode, LText> = {
  couple: { ja: '恋人と', en: 'With your partner' },
  friends: { ja: '友達と', en: 'With friends' },
}

export const LEVEL_LABEL: Record<number, LText> = {
  1: { ja: 'ライト', en: 'Light' },
  2: { ja: 'ミディアム', en: 'Medium' },
  3: { ja: 'ディープ', en: 'Deep' },
  4: { ja: '本音', en: 'Honne' },
}

export const TYPE_LABEL: Record<string, LText> = {
  open: { ja: '質問', en: 'Question' },
  choice: { ja: 'どっち派？', en: 'Pick one' },
  guess: { ja: '当てっこ', en: 'Guess' },
  reveal: { ja: 'せーの', en: 'Reveal together' },
  scale: { ja: '10点満点で', en: 'Rate it' },
  thanks: { ja: 'ありがとう', en: 'Thank you' },
  wish: { ja: 'お願い・約束', en: 'Wish' },
  action: { ja: 'ミッション', en: 'Mission' },
}
