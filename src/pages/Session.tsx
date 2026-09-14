import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QuestionCard, type QuestionCardHandle } from '../components/QuestionCard'
import { findDeck } from '../content'
import { buildQueue } from '../session/build'
import { assignTurns, participants } from '../session/people'
import { useStore } from '../store'
import type { AnswerRecord, SessionConfig } from '../types'

interface Draft {
  memo: string
  values?: string[]
  result?: 'hit' | 'miss'
}

export default function Session() {
  const nav = useNavigate()
  const cfg = useLocation().state as SessionConfig | null
  const deck = findDeck(cfg?.deckId ?? '')
  const profile = useStore((s) => s.profile)
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const markSeen = useStore((s) => s.markSeen)
  const saveAnswer = useStore((s) => s.saveAnswer)
  const startSession = useStore((s) => s.startSession)
  const updateSession = useStore((s) => s.updateSession)

  const seenAtStart = useRef(useStore.getState().seen[cfg?.deckId ?? ''] ?? [])
  const queue = useMemo(
    () => (deck && cfg ? buildQueue(deck, cfg, seenAtStart.current, profile.adult) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck?.id],
  )
  const people = useMemo(
    () => (deck ? participants(deck.mode, profile.names, profile.friends) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck?.id],
  )
  const turns = useMemo(() => (deck ? assignTurns(deck.mode, people, queue) : []), [deck, people, queue])
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState<Draft>({ memo: '' })
  const stats = useRef({ answered: 0, passed: 0, hits: 0, misses: 0 })
  const sessionId = useRef(`${Date.now()}`)
  const cardRef = useRef<QuestionCardHandle>(null)

  useEffect(() => {
    if (!deck) return
    startSession({
      id: sessionId.current,
      deckId: deck.id,
      mode: deck.mode,
      startedAt: new Date().toISOString(),
      answered: 0,
      passed: 0,
      hits: 0,
      misses: 0,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!deck || !cfg) return <Navigate to="/home" replace />

  const card = queue[idx]
  const next = queue[idx + 1]

  const finish = () => {
    updateSession(sessionId.current, { endedAt: new Date().toISOString(), ...stats.current })
    nav('/summary', { replace: true, state: { sessionId: sessionId.current } })
  }

  const advance = (dir: 'next' | 'pass') => {
    if (!card) return
    markSeen(deck.id, card.id)
    if (dir === 'next') {
      stats.current.answered++
      if (draft.result === 'hit') stats.current.hits++
      if (draft.result === 'miss') stats.current.misses++
      if (draft.memo || draft.values?.some(Boolean) || draft.result) {
        const rec: AnswerRecord = {
          cardId: card.id,
          deckId: deck.id,
          at: new Date().toISOString(),
          memo: draft.memo || undefined,
          values: draft.values,
          result: draft.result,
        }
        saveAnswer(rec)
      }
    } else {
      stats.current.passed++
    }
    setDraft({ memo: '' })
    if (idx + 1 >= queue.length) finish()
    else setIdx(idx + 1)
  }

  const turn = turns[idx] ?? { first: people[0], second: people[1] }
  const namedFriends = deck.mode === 'friends' && profile.friends.filter((n) => n.trim()).length >= 2
  const turnLine = (() => {
    if (deck.mode === 'friends' && !namedFriends) {
      return (
        <>
          <b>時計回り</b>で順番に答えよう
        </>
      )
    }
    switch (card?.type) {
      case 'guess':
        return (
          <>
            <b>{turn.first}</b> の答えをみんなで予想
          </>
        )
      case 'thanks':
      case 'wish':
        return (
          <>
            <b>{turn.first}</b> → <b>{turn.second}</b> へ
          </>
        )
      default:
        return deck.mode === 'couple' ? (
          <>
            <b>{turn.first}</b> が最初に答える番
          </>
        ) : (
          <>
            <b>{turn.first}</b> から時計回りに
          </>
        )
    }
  })()

  return (
    <div className="shell full stage" style={{ ['--deck' as string]: deck.color }}>
      <div className="topbar">
        <span className="small muted">
          {deck.name.ja} ・ {idx + 1}/{queue.length}
        </span>
        <button className="iconbtn danger" onClick={finish} aria-label="終了">
          ✕
        </button>
      </div>
      <div className="progress">
        <i style={{ width: `${((idx + 1) / queue.length) * 100}%` }} />
      </div>

      <p className="turn">{turnLine}</p>

      <div className="cardarea">
          {next && (
            <QuestionCard
              key={next.id}
              back
              card={next}
              deck={deck}
              people={people}
              turn={turns[idx + 1]?.first ?? people[0]}
              showEnglish={profile.showEnglish}
              favorite={false}
              onToggleFavorite={() => {}}
              onSwipe={() => {}}
              onValues={() => {}}
              onResult={() => {}}
              memo=""
              onMemo={() => {}}
            />
          )}
          {card && (
            <QuestionCard
              key={card.id}
              ref={cardRef}
              card={card}
              deck={deck}
              people={people}
              turn={turn.first}
              showEnglish={profile.showEnglish}
              favorite={favorites.includes(card.id)}
              onToggleFavorite={() => toggleFavorite(card.id)}
              onSwipe={advance}
              onValues={(values) => setDraft((d) => ({ ...d, values }))}
              onResult={(result) => setDraft((d) => ({ ...d, result }))}
              memo={draft.memo}
              onMemo={(memo) => setDraft((d) => ({ ...d, memo }))}
            />
          )}
      </div>

      <p className="swipehint">← パス ／ 話したら次へ →</p>
      <div className="actions">
        <button className="btn" onClick={() => cardRef.current?.swipe('pass')}>
          パス
        </button>
        <button className="btn primary" style={{ background: deck.color }} onClick={() => cardRef.current?.swipe('next')}>
          次のカード
        </button>
      </div>
    </div>
  )
}
