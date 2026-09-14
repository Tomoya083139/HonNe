import type { Card, Deck, Level, SessionConfig } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
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
    // レベルごとに均等配分。足りないレベルは他レベルから補う
    const byLevel = new Map<Level, Card[]>()
    for (const lv of cfg.levels) byLevel.set(lv, [])
    for (const c of shuffle(fresh)) byLevel.get(c.level)!.push(c)
    for (const c of shuffle(pool.filter((c) => seen.includes(c.id)))) byLevel.get(c.level)!.push(c)

    const levels = [...cfg.levels].sort((a, b) => a - b)
    const quota = Math.ceil(target / levels.length)
    picked = []
    const leftovers: Card[] = []
    for (const lv of levels) {
      const list = byLevel.get(lv)!
      picked.push(...list.slice(0, quota))
      leftovers.push(...list.slice(quota))
    }
    if (picked.length < target) {
      picked.push(...leftovers.slice(0, target - picked.length))
      picked.sort((a, b) => a.level - b.level)
    }
    picked = picked.slice(0, target)
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
