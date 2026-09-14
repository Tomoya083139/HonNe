import { useEffect, useState } from 'react'
import type { Card, Mode } from '../types'

/** 恋人モードは2人の名前、友達モードは「あなた / 相手」 */
export function personLabels(mode: Mode, names: [string, string]): [string, string] {
  if (mode === 'couple') return [names[0] || 'あなた', names[1] || '相手']
  return ['あなた', '相手']
}

export interface WidgetProps {
  card: Card
  mode: Mode
  names: [string, string]
  showEnglish: boolean
  onValues: (values: string[]) => void
  onResult: (r: 'hit' | 'miss') => void
}

/** 二択・三択: 2人がそれぞれ選び、一致したら表示 */
export function ChoiceWidget({ card, mode, names, showEnglish, onValues }: WidgetProps) {
  const [who, setWho] = useState(0)
  const [picks, setPicks] = useState<(number | null)[]>([null, null])
  const labels = personLabels(mode, names)
  const opts = card.options ?? []

  const pick = (i: number) => {
    const next = picks.slice()
    next[who] = i
    setPicks(next)
    onValues(next.map((p) => (p == null ? '' : opts[p].ja)))
    if (who === 0 && next[1] == null) setWho(1)
  }
  const done = picks[0] != null && picks[1] != null
  return (
    <div className="widget">
      <div className="pickers">
        {labels.map((l, i) => (
          <button key={i} className={who === i ? 'on' : ''} onClick={() => setWho(i)}>
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
              {picks.map((p, pi) => (p === i ? <span key={pi}>{labels[pi]}</span> : null))}
            </span>
          </button>
        ))}
      </div>
      {done && (
        <div className="match">
          {picks[0] === picks[1] ? '一致！同じ派でした 🎉' : '違う派！理由を聞いてみよう 👀'}
        </div>
      )}
    </div>
  )
}

/** せーの: 2人が書いてから同時公開 */
export function RevealWidget({ mode, names, onValues }: WidgetProps) {
  const [vals, setVals] = useState(['', ''])
  const [open, setOpen] = useState(false)
  const labels = personLabels(mode, names)
  const set = (i: number, v: string) => {
    const next = vals.slice()
    next[i] = v
    setVals(next)
    onValues(next)
  }
  return (
    <div className="widget">
      {labels.map((l, i) => (
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
        disabled={!vals[0] && !vals[1]}
      >
        {open ? '隠す' : 'せーの！で公開'}
      </button>
      {open && vals[0] && vals[1] && (
        <div className="match">
          {vals[0].trim() === vals[1].trim() ? 'まさかの一致！' : 'お互いの答え、どう思った？'}
        </div>
      )}
    </div>
  )
}

/** 10点満点 */
export function ScaleWidget({ mode, names, onValues }: WidgetProps) {
  const [vals, setVals] = useState([5, 5])
  const labels = personLabels(mode, names)
  const set = (i: number, v: number) => {
    const next = vals.slice()
    next[i] = v
    setVals(next)
    onValues(next.map(String))
  }
  return (
    <div className="widget">
      {labels.map((l, i) => (
        <div className="person-row" key={i}>
          <label>{l}</label>
          <input
            type="range"
            min={1}
            max={10}
            value={vals[i]}
            onChange={(e) => set(i, Number(e.target.value))}
          />
          <output>{vals[i]}</output>
        </div>
      ))}
      <div className="match">
        {Math.abs(vals[0] - vals[1]) <= 1 ? 'ほぼ同じ感覚' : `${Math.abs(vals[0] - vals[1])} 点差。なぜ違う？`}
      </div>
    </div>
  )
}

/** 当てっこ: 相手の答えを予想 → 正解/不正解 */
export function GuessWidget({ mode, names, onResult }: WidgetProps) {
  const [r, setR] = useState<'hit' | 'miss' | null>(null)
  const labels = personLabels(mode, names)
  const choose = (v: 'hit' | 'miss') => {
    setR(v)
    onResult(v)
  }
  return (
    <div className="widget">
      <p className="small muted" style={{ margin: 0 }}>
        {labels[0]}が予想して答える → {labels[1]}が正解を発表
      </p>
      <div className="result-btns">
        <button className={r === 'hit' ? 'on' : ''} onClick={() => choose('hit')}>
          ⭕ 当たり
        </button>
        <button className={r === 'miss' ? 'on' : ''} onClick={() => choose('miss')}>
          ❌ はずれ
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
      placeholder="2人の答えをメモ（あとで振り返れます）"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
