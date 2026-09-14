import { useState } from 'react'
import { findCard, findDeck } from '../content'
import { useStore } from '../store'
import { BottomNav } from './Home'

export default function Library() {
  const [tab, setTab] = useState<'fav' | 'memo' | 'history'>('fav')
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const answers = useStore((s) => s.answers)
  const sessions = useStore((s) => s.sessions)
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })

  return (
    <div className="shell">
      <div className="topbar">
        <h1>記録</h1>
      </div>
      <div className="tabs">
        <button className={tab === 'fav' ? 'active' : ''} onClick={() => setTab('fav')}>
          ♥ お気に入り
        </button>
        <button className={tab === 'memo' ? 'active' : ''} onClick={() => setTab('memo')}>
          ✏️ 答え
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          🕒 履歴
        </button>
      </div>

      {tab === 'fav' && (
        <div className="list">
          {favorites.length === 0 && <p className="muted">カードの ♡ を押すとここに残ります。</p>}
          {favorites
            .slice()
            .reverse()
            .map((id) => {
              const f = findCard(id)
              if (!f) return null
              return (
                <div className="item" key={id} style={{ ['--deck' as string]: f.deck.color }}>
                  <div className="t">{f.card.text.ja}</div>
                  <div className="row" style={{ marginTop: 6 }}>
                    <span className="small muted">{f.deck.name.ja}</span>
                    <span className="spacer" />
                    <button className="small" style={{ color: 'var(--accent)' }} onClick={() => toggleFavorite(id)}>
                      外す
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {tab === 'memo' && (
        <div className="list">
          {answers.length === 0 && <p className="muted">カードにメモや答えを残すとここで振り返れます。</p>}
          {answers
            .slice()
            .reverse()
            .map((a) => {
              const f = findCard(a.cardId)
              if (!f) return null
              return (
                <div className="item" key={a.cardId + a.at} style={{ ['--deck' as string]: f.deck.color }}>
                  <div className="t">{f.card.text.ja}</div>
                  {a.values?.some(Boolean) && <div className="m">{a.values.filter(Boolean).join(' ／ ')}</div>}
                  {a.result && <div className="m">{a.result === 'hit' ? '⭕ 当たり' : '❌ はずれ'}</div>}
                  {a.memo && <div className="m">{a.memo}</div>}
                  <div className="small muted" style={{ marginTop: 6 }}>
                    {fmt(a.at)} ・ {f.deck.name.ja}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {tab === 'history' && (
        <div className="list">
          {sessions.length === 0 && <p className="muted">まだセッションがありません。</p>}
          {sessions
            .filter((s) => s.answered + s.passed > 0)
            .reverse()
            .map((s) => {
              const d = findDeck(s.deckId)
              return (
                <div className="item" key={s.id} style={{ ['--deck' as string]: d?.color }}>
                  <div className="t">{d?.name.ja}</div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {fmt(s.startedAt)} ・ 話した {s.answered} 枚 ・ パス {s.passed} 枚
                  </div>
                </div>
              )
            })}
        </div>
      )}

      <div className="spacer" />
      <BottomNav />
    </div>
  )
}
