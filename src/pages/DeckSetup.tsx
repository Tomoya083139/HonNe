import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { findDeck } from '../content'
import { LEVEL_LABEL, THEMES } from '../content/themes'
import { countAvailable } from '../session/build'
import { useStore } from '../store'
import type { Level, SessionConfig } from '../types'

const COUNTS = [5, 10, 20, 30, 0]
const EMPTY: string[] = []

export default function DeckSetup() {
  const { id } = useParams()
  const nav = useNavigate()
  const deck = findDeck(id ?? '')
  const adult = useStore((s) => s.profile.adult)
  const seen = useStore((s) => s.seen[id ?? '']) ?? EMPTY
  const resetSeen = useStore((s) => s.resetSeen)

  const [themes, setThemes] = useState<string[]>([])
  const [levels, setLevels] = useState<Level[]>([1, 2, 3, 4])
  const [count, setCount] = useState(10)
  const [gradient, setGradient] = useState(true)

  if (!deck) return <div className="shell">デッキが見つかりません</div>

  const cfg: SessionConfig = { deckId: deck.id, themes, levels, count, gradient }
  const available = countAvailable(deck, cfg, adult)
  const levelsInDeck = [...new Set(deck.cards.map((c) => c.level))].sort() as Level[]

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <div className="shell" style={{ ['--deck' as string]: deck.color }}>
      <div className="topbar">
        <button className="iconbtn" onClick={() => nav(-1)} aria-label="戻る">
          ←
        </button>
        <h1>{deck.name.ja}</h1>
        <span style={{ width: 40 }} />
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        {deck.tagline.ja}
      </p>

      <div className="section">
        <h4>テーマ（未選択 = すべて）</h4>
        <div className="chips">
          {deck.themes.map((t) => (
            <button
              key={t}
              className={'chip' + (themes.includes(t) ? ' on' : '')}
              onClick={() => setThemes(toggle(themes, t))}
            >
              {THEMES[t]?.ja ?? t}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h4>深さ</h4>
        <div className="chips">
          {levelsInDeck.map((lv) => (
            <button
              key={lv}
              className={'chip' + (levels.includes(lv) ? ' on' : '')}
              onClick={() => setLevels(toggle(levels, lv).sort())}
            >
              Lv.{lv} {LEVEL_LABEL[lv].ja}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h4>枚数</h4>
        <div className="chips">
          {COUNTS.map((n) => (
            <button key={n} className={'chip' + (count === n ? ' on' : '')} onClick={() => setCount(n)}>
              {n === 0 ? '無制限' : `${n}枚`}
            </button>
          ))}
        </div>
      </div>

      <label className="toggle">
        <span>
          ライト → 本音の順に深めていく
          <div className="small muted">オフにすると完全ランダム</div>
        </span>
        <input type="checkbox" checked={gradient} onChange={(e) => setGradient(e.target.checked)} />
      </label>

      <div className="spacer" />

      <p className="small muted" style={{ textAlign: 'center' }}>
        条件に合うカード {available} 枚（うち既出 {seen.length} 枚）
        {seen.length > 0 && (
          <>
            {' '}
            <button className="btn ghost small" style={{ padding: 4 }} onClick={() => resetSeen(deck.id)}>
              既出をリセット
            </button>
          </>
        )}
      </p>
      <button
        className="btn primary block"
        style={{ background: deck.color }}
        disabled={available === 0 || levels.length === 0}
        onClick={() => nav('/session', { state: cfg })}
      >
        はじめる
      </button>
    </div>
  )
}
