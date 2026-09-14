import type { Card, Deck, Level, SessionConfig } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** レベルごとに均等配分で target 枚まで取る。足りないレベルは他レベルの余りで補う */
function pickByLevel(cards: Card[], levels: Level[], target: number): Card[] {
  const byLevel = new Map<Level, Card[]>()
  for (const lv of levels) byLevel.set(lv, [])
  for (const c of cards) byLevel.get(c.level)?.push(c)
  const quota = Math.ceil(target / Math.max(levels.length, 1))
  const picked: Card[] = []
  const leftovers: Card[] = []
  for (const lv of [...levels].sort((a, b) => a - b)) {
    const list = byLevel.get(lv)!
    picked.push(...list.slice(0, quota))
    leftovers.push(...list.slice(quota))
  }
  if (picked.length < target) picked.push(...leftovers.slice(0, target - picked.length))
  return picked.slice(0, target)
}

/**
 * セッションの出題キューを作る。
 * - テーマ / レベル / 16+ でフィルタ
 * - 既出カードを除外（足りなければ既出も含める）
 * - gradient=true なら ライト→ディープ の順に並べる（レベル内はシャッフル）
 */
export function buildQueue(
  deck: Deck,
  cfg: SessionConfig,
  seen: string[],
  adult: boolean,
): Card[] {
  const pool = deck.cards.filter(
    (c) =>
      cfg.levels.includes(c.level) &&
      (cfg.themes.length === 0 || c.themes.some((t) => cfg.themes.includes(t))) &&
      (adult || c.rating !== '16+'),
  )
  const fresh = pool.filter((c) => !seen.includes(c.id))
  const target = cfg.count > 0 ? cfg.count : pool.length
  let picked: Card[]

  if (cfg.gradient) {
    // 未出題を優先し、足りない分だけ既出から補う。どちらもレベル均等に取ってから並べ替える
    picked = pickByLevel(shuffle(fresh), cfg.levels, target)
    if (picked.length < target) {
      const seenCards = shuffle(pool.filter((c) => seen.includes(c.id)))
      picked.push(...pickByLevel(seenCards, cfg.levels, target - picked.length))
    }
    picked.sort((a, b) => a.level - b.level)
  } else {
    picked = shuffle(fresh)
    if (picked.length < target) {
      picked.push(...shuffle(pool.filter((c) => seen.includes(c.id))))
    }
    picked = picked.slice(0, target)
  }
  return picked
}

export function countAvailable(deck: Deck, cfg: SessionConfig, adult: boolean) {
  return deck.cards.filter(
    (c) =>
      cfg.levels.includes(c.level) &&
      (cfg.themes.length === 0 || c.themes.some((t) => cfg.themes.includes(t))) &&
      (adult || c.rating !== '16+'),
  ).length
}
