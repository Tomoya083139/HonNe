// 質問 JSON の整合性チェック（重複ID・必須項目・翻訳漏れ・型別必須フィールド）
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = 'src/content/decks'
const TYPES = ['open', 'choice', 'guess', 'reveal', 'scale', 'thanks', 'wish', 'action']
const ids = new Set()
const texts = new Set()
let errors = 0
let total = 0
const err = (m) => { console.error('ERROR:', m); errors++ }

for (const mode of readdirSync(root)) {
  for (const f of readdirSync(join(root, mode))) {
    const deck = JSON.parse(readFileSync(join(root, mode, f), 'utf8'))
    if (deck.mode !== mode) err(`${f}: mode "${deck.mode}" != folder "${mode}"`)
    if (!deck.id || !deck.name?.ja || !deck.color || !Array.isArray(deck.themes)) err(`${f}: deck header incomplete`)
    const byLevel = {}
    for (const c of deck.cards) {
      total++
      if (ids.has(c.id)) err(`${c.id}: duplicate id`)
      ids.add(c.id)
      if (!c.id.startsWith(deck.id + '_')) err(`${c.id}: id must start with ${deck.id}_`)
      if (!TYPES.includes(c.type)) err(`${c.id}: unknown type ${c.type}`)
      if (![1, 2, 3, 4].includes(c.level)) err(`${c.id}: bad level`)
      if (!c.text?.ja || !c.text?.en) err(`${c.id}: missing ja/en text`)
      if (texts.has(c.text?.ja)) err(`${c.id}: duplicate question text`)
      texts.add(c.text?.ja)
      for (const t of c.themes ?? []) if (!deck.themes.includes(t)) err(`${c.id}: theme "${t}" not declared in deck`)
      if (c.type === 'choice' && !(c.options?.length >= 2)) err(`${c.id}: choice needs >=2 options`)
      if (c.type === 'action' && !c.seconds) err(`${c.id}: action needs seconds`)
      byLevel[c.level] = (byLevel[c.level] ?? 0) + 1
    }
    console.log(`${deck.id.padEnd(20)} ${String(deck.cards.length).padStart(3)} cards  levels=${JSON.stringify(byLevel)}`)
  }
}
console.log(`\n${total} cards total, ${errors} error(s)`)
process.exit(errors ? 1 : 0)
