import { NavLink, useNavigate } from 'react-router-dom'
import { decksByMode } from '../content'
import { useStore } from '../store'
import type { Mode } from '../types'

export function BottomNav() {
  return (
    <nav className="bottomnav">
      <NavLink to="/home">🃏 カード</NavLink>
      <NavLink to="/library">📚 記録</NavLink>
      <NavLink to="/settings">⚙️ 設定</NavLink>
    </nav>
  )
}

export default function Home() {
  const nav = useNavigate()
  const mode = useStore((s) => s.profile.mode)
  const seen = useStore((s) => s.seen)
  const adult = useStore((s) => s.profile.adult)
  const setProfile = useStore((s) => s.setProfile)
  const decks = decksByMode(mode)
  const setMode = (m: Mode) => setProfile({ mode: m })

  return (
    <div className="shell">
      <div className="topbar">
        <h1 className="brand">本音</h1>
        <span className="small muted">
          {mode === 'couple' ? '恋人と、ちょっと深く。' : '友達と、盛り上がりながら深く。'}
        </span>
      </div>

      <div className="modeswitch">
        <button className={mode === 'couple' ? 'active' : ''} onClick={() => setMode('couple')}>
          💞 恋人と
        </button>
        <button
          className={mode === 'friends' ? 'active friends' : ''}
          onClick={() => setMode('friends')}
        >
          🍻 友達と
        </button>
      </div>

      <div className="decklist">
        {decks.map((d) => {
          const total = d.cards.filter((c) => adult || c.rating !== '16+').length
          const done = (seen[d.id] ?? []).length
          return (
            <button
              key={d.id}
              className="decktile"
              style={{ background: d.color }}
              onClick={() => nav(`/deck/${d.id}`)}
            >
              <h3>{d.name.ja}</h3>
              <p>{d.tagline.ja}</p>
              <span className="count">
                {done}/{total} 枚
              </span>
            </button>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
