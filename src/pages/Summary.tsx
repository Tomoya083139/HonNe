import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { findCard, findDeck } from '../content'
import { useStore } from '../store'

export default function Summary() {
  const nav = useNavigate()
  const { sessionId } = (useLocation().state as { sessionId?: string } | null) ?? {}
  const session = useStore((s) => s.sessions.find((x) => x.id === sessionId))
  const answers = useStore((s) => s.answers)
  const deck = findDeck(session?.deckId ?? '')

  if (!session || !deck) return <Navigate to="/home" replace />
  const memos = answers.filter(
    (a) => a.deckId === deck.id && a.at >= session.startedAt && (!session.endedAt || a.at <= session.endedAt),
  )
  const guessTotal = session.hits + session.misses

  return (
    <div className="shell" style={{ ['--deck' as string]: deck.color }}>
      <div className="hero" style={{ paddingTop: 24 }}>
        <div className="logo">本音</div>
        <p>おつかれさま。今日はここまで。</p>
      </div>

      <div className="summary-stats">
        <div className="stat">
          <b>{session.answered}</b>
          <span>話した</span>
        </div>
        <div className="stat">
          <b>{session.passed}</b>
          <span>パス</span>
        </div>
        <div className="stat">
          <b>{guessTotal ? `${session.hits}/${guessTotal}` : memos.length}</b>
          <span>{guessTotal ? '当てっこ正解' : 'メモ'}</span>
        </div>
      </div>

      {memos.length > 0 && (
        <div className="section">
          <h4>今日の記録</h4>
          <div className="list">
            {memos.map((a) => {
              const c = findCard(a.cardId)?.card
              return (
                <div className="item" key={a.cardId + a.at}>
                  <div className="t">{c?.text.ja}</div>
                  {a.values?.some(Boolean) && <div className="m">{a.values.filter(Boolean).join(' ／ ')}</div>}
                  {a.result && <div className="m">{a.result === 'hit' ? '⭕ 当たり' : '❌ はずれ'}</div>}
                  {a.memo && <div className="m">{a.memo}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="spacer" />
      <div className="stack">
        <button className="btn primary block" style={{ background: deck.color }} onClick={() => nav(`/deck/${deck.id}`)}>
          もう一回
        </button>
        <button className="btn block" onClick={() => nav('/home')}>
          ホームへ
        </button>
      </div>
    </div>
  )
}
