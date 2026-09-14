import { forwardRef, useImperativeHandle, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { Card, Deck } from '../types'
import { LEVEL_LABEL, TYPE_LABEL } from '../content/themes'
import {
  ActionWidget,
  ChoiceWidget,
  GuessWidget,
  MemoWidget,
  RevealWidget,
  ScaleWidget,
  type WidgetProps,
} from './Widgets'

const TYPE_ICON: Record<string, string> = {
  open: '💬',
  choice: '⚖️',
  guess: '🎯',
  reveal: '🙈',
  scale: '📊',
  thanks: '💐',
  wish: '🌙',
  action: '⏱️',
}

interface Props {
  card: Card
  deck: Deck
  people: string[]
  turn: string
  showEnglish: boolean
  favorite: boolean
  onToggleFavorite: () => void
  onSwipe: (dir: 'next' | 'pass') => void
  onValues: (v: string[]) => void
  onResult: (r: 'hit' | 'miss') => void
  memo: string
  onMemo: (v: string) => void
  /** 背面カード（操作不可） */
  back?: boolean
}

export interface QuestionCardHandle {
  swipe: (dir: 'next' | 'pass') => void
}

export const QuestionCard = forwardRef<QuestionCardHandle, Props>(function QuestionCard(p, ref) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-250, 250], [-12, 12])
  const [showMemo, setShowMemo] = useState(false)
  const [leaving, setLeaving] = useState(false)

  // カードを画面外へ飛ばしてから onSwipe を呼ぶ
  const swipe = (dir: 'next' | 'pass') => {
    if (leaving) return
    setLeaving(true)
    animate(x, dir === 'next' ? 600 : -600, { duration: 0.22, ease: 'easeIn' })
    // アニメーション完了を Promise に頼らず、時間で確実に次へ進める
    window.setTimeout(() => p.onSwipe(dir), 230)
  }
  useImperativeHandle(ref, () => ({ swipe }))

  const widgetProps: WidgetProps = {
    card: p.card,
    people: p.people,
    turn: p.turn,
    showEnglish: p.showEnglish,
    onValues: p.onValues,
    onResult: p.onResult,
  }

  const widget = (() => {
    switch (p.card.type) {
      case 'choice':
        return <ChoiceWidget {...widgetProps} />
      case 'reveal':
        return <RevealWidget {...widgetProps} />
      case 'scale':
        return <ScaleWidget {...widgetProps} />
      case 'guess':
        return <GuessWidget {...widgetProps} />
      case 'action':
        return <ActionWidget {...widgetProps} />
      default:
        return null
    }
  })()

  return (
    <motion.div
      className="card"
      style={{ ['--deck' as string]: p.deck.color, x, rotate, zIndex: p.back ? 0 : 1 }}
      drag={p.back ? false : 'x'}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (info.offset.x > 110 || info.velocity.x > 600) swipe('next')
        else if (info.offset.x < -110 || info.velocity.x < -600) swipe('pass')
        else animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
      }}
      initial={{ scale: 0.95, y: 12 }}
      animate={p.back ? { scale: 0.95, y: 12 } : { scale: 1, y: 0 }}
    >
      <div className="wave">
        <button
          className={'fav' + (p.favorite ? ' on' : '')}
          onClick={p.onToggleFavorite}
          aria-label="お気に入り"
        >
          {p.favorite ? '♥' : '♡'}
        </button>
        <span className="lv">Lv.{p.card.level} {LEVEL_LABEL[p.card.level].ja}</span>
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden>
          <path
            d="M0,70 L0,55 C60,50 90,10 160,20 C230,30 260,0 400,10 L400,70 Z"
            fill="var(--surface)"
          />
        </svg>
      </div>
      <div className="body">
        {p.card.type !== 'open' && (
          <span className="badge">
            {TYPE_ICON[p.card.type]} {TYPE_LABEL[p.card.type].ja}
          </span>
        )}
        <p className="q">{p.card.text.ja}</p>
        {p.showEnglish && <p className="en">{p.card.text.en}</p>}
        {!p.back && (
          // ウィジェット内の操作（スライダー・入力）でカードのドラッグが始まらないようにする
          <div className="interact" onPointerDownCapture={(e) => e.stopPropagation()}>
            {widget}
            {showMemo ? (
              <MemoWidget value={p.memo} onChange={p.onMemo} />
            ) : (
              <button className="btn ghost small" onClick={() => setShowMemo(true)}>
                ✏️ メモを残す
              </button>
            )}
          </div>
        )}
        <div className="logo">本音</div>
      </div>
    </motion.div>
  )
})
