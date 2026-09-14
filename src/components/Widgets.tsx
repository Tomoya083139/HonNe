import { useEffect, useState } from 'react'
import type { Card } from '../types'

export interface WidgetProps {
  card: Card
  /** 参加者名（恋人モードは2人、友達モードは2〜8人） */
  people: string[]
  /** このカードで指名された人（当てっこの回答者など） */
  turn: string
  showEnglish: boolean
  onValues: (values: string[]) => void
  onResult: (r: 'hit' | 'miss') => void
}

/** どっち派？: 全員がそれぞれ選び、多数派 / 少数派を表示 */
export function ChoiceWidget({ card, people, showEnglish, onValues }: WidgetProps) {
  const [who, setWho] = useState(0)
  const [picks, setPicks] = useState<(number | null)[]>(people.map(() => null))
  const opts = card.options ?? []

  const pick = (i: number) => {
    const next = picks.slice()
    next[who] = i
    setPicks(next)
    onValues(next.map((p) => (p == null ? '' : opts[p].ja)))
    // まだ選んでいない人へ自動で移る
    const rest = next.findIndex((p, k) => p == null && k !== who)
    if (rest >= 0) setWho(rest)
  }
  const done = picks.every((p) => p != null)

  const verdict = () => {
    if (people.length === 2) {
      return picks[0] === picks[1] ? '一致！同じ派でした 🎉' : '違う派！理由を聞いてみよう 👀'
    }
    const tally = new Map<number, string[]>()
    picks.forEach((p, k) => tally.set(p!, [...(tally.get(p!) ?? []), people[k]]))
    if (tally.size === 1) return '全員一致！🎉'
    const sorted = [...tally.entries()].sort((a, b) => b[1].length - a[1].length)
    const [topIdx, topNames] = sorted[0]
    const minority = sorted.slice(1).flatMap(([, n]) => n)
    return `多数派は「${opts[topIdx].ja}」(${topNames.length}人)。少数派の ${minority.join('・')} に理由を聞こう 👀`
  }

  return (
    <div className="widget">
      <div className="pickers">
        {people.map((l, i) => (
          <button key={i} className={who === i ? 'on' : picks[i] != null ? 'done' : ''} onClick={() => setWho(i)}>
            {l}
          </button>
        ))}
      </div>
      <div className="optlist">
        {opts.map((o, i) => (
          <button key={i} className="opt" onClick={() => pick(i)}>
            <span>
              {o.ja}
              {showEnglish && <span className="muted small"> / {o.en}</span>}
            </span>
            <span className="who">
              {picks.map((p, pi) => (p === i ? <span key={pi}>{people[pi]}</span> : null))}
            </span>
          </button>
        ))}
      </div>
      {done && <div className="match">{verdict()}</div>}
    </div>
  )
}

/** せーの: 全員が書いてから同時公開 */
export function RevealWidget({ people, onValues }: WidgetProps) {
  const [vals, setVals] = useState(people.map(() => ''))
  const [open, setOpen] = useState(false)
  const set = (i: number, v: string) => {
    const next = vals.slice()
    next[i] = v
    setVals(next)
    onValues(next)
  }
  const filled = vals.filter((v) => v.trim())
  const allSame = filled.length >= 2 && filled.every((v) => v.trim() === filled[0].trim())
  return (
    <div className="widget">
      {people.map((l, i) => (
        <div className="person-row" key={i}>
          <label>{l}</label>
          <input
            type="text"
            className={open ? '' : 'hidden'}
            placeholder="こっそり入力"
            value={vals[i]}
            onChange={(e) => set(i, e.target.value)}
            autoComplete="off"
          />
        </div>
      ))}
      <button
        className="btn"
        style={{ background: 'var(--deck)', color: '#fff' }}
        onClick={() => setOpen((o) => !o)}
        disabled={filled.length === 0}
      >
        {open ? '隠す' : 'せーの！で公開'}
      </button>
      {open && filled.length >= 2 && (
        <div className="match">{allSame ? 'まさかの全員一致！' : 'お互いの答え、どう思った？'}</div>
      )}
    </div>
  )
}

/** 10点満点 */
export function ScaleWidget({ people, onValues }: WidgetProps) {
  const [vals, setVals] = useState(people.map(() => 5))
  const set = (i: number, v: number) => {
    const next = vals.slice()
    next[i] = v
    setVals(next)
    onValues(next.map(String))
  }
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  const verdict =
    max - min <= 1
      ? 'ほぼ同じ感覚'
      : people.length === 2
        ? `${max - min} 点差。なぜ違う？`
        : `最高 ${max}（${people[vals.indexOf(max)]}）／ 最低 ${min}（${people[vals.indexOf(min)]}）。差は ${max - min} 点`
  return (
    <div className="widget">
      {people.map((l, i) => (
        <div className="person-row" key={i}>
          <label>{l}</label>
          <input type="range" min={1} max={10} value={vals[i]} onChange={(e) => set(i, Number(e.target.value))} />
          <output>{vals[i]}</output>
        </div>
      ))}
      <div className="match">{verdict}</div>
    </div>
  )
}

/** 当てっこ: 指名された人の答えをみんなで予想 → 本人が発表 */
export function GuessWidget({ people, turn, onResult }: WidgetProps) {
  const [r, setR] = useState<'hit' | 'miss' | null>(null)
  const choose = (v: 'hit' | 'miss') => {
    setR(v)
    onResult(v)
  }
  const others = people.filter((p) => p !== turn)
  return (
    <div className="widget">
      <p className="small muted" style={{ margin: 0 }}>
        {people.length === 2
          ? `${others[0]}が予想して答える → ${turn}が正解を発表`
          : `みんなで ${turn} の答えを予想 → ${turn} が正解を発表`}
      </p>
      <div className="result-btns">
        <button className={r === 'hit' ? 'on' : ''} onClick={() => choose('hit')}>
          ⭕ {people.length === 2 ? '当たり' : '誰か当てた'}
        </button>
        <button className={r === 'miss' ? 'on' : ''} onClick={() => choose('miss')}>
          ❌ {people.length === 2 ? 'はずれ' : '全員はずれ'}
        </button>
      </div>
    </div>
  )
}

/** ミッション: タイマー付き */
export function ActionWidget({ card }: WidgetProps) {
  const total = card.seconds ?? 0
  const [left, setLeft] = useState(total)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running || left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [running, left])
  if (!total) return null
  return (
    <div className="widget">
      <div className="timer">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </div>
      <div className="result-btns">
        <button
          className={running ? 'on' : ''}
          onClick={() => {
            if (left === 0) setLeft(total)
            setRunning((r) => !r)
          }}
        >
          {left === 0 ? 'もう一回' : running ? '一時停止' : 'スタート'}
        </button>
        <button
          onClick={() => {
            setRunning(false)
            setLeft(total)
          }}
        >
          リセット
        </button>
      </div>
    </div>
  )
}

export function MemoWidget({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      className="memo"
      placeholder="みんなの答えをメモ（あとで振り返れます）"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
