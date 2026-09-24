import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FriendsEditor } from '../components/FriendsEditor'
import { useStore } from '../store'
import type { Mode } from '../types'

const RULES = [
  { t: '相手の話は最後まで聞く', d: '途中で評価しない。まず受け取る。' },
  { t: 'ここでは本音を話していい', d: '普段言えないことも、この時間だけは自由。' },
  { t: '話したくないカードはパス', d: '左にスワイプするだけ。理由はいらない。' },
  { t: '「普通は」ではなく「私は」', d: '正解探しではなく、自分の言葉で。' },
]

export default function Onboarding() {
  const nav = useNavigate()
  const setProfile = useStore((s) => s.setProfile)
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<Mode>('couple')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [friends, setFriends] = useState<string[]>(['', '', ''])

  const finish = () => {
    setProfile({ onboarded: true, mode, names: [a.trim(), b.trim()], friends: friends.map((n) => n.trim()) })
    nav('/home', { replace: true })
  }

  return (
    <div className="shell">
      <div className="hero">
        <div className="logo">本音</div>
        <p>恋人と、友達と。ちゃんと話す時間をつくる。</p>
      </div>

      {step === 0 && (
        <>
          <div className="rules">
            {RULES.map((r, i) => (
              <div className="rule" key={i}>
                <div className="n">{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.t}</div>
                  <div className="small muted">{r.d}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn primary block" onClick={() => setStep(1)}>
            はじめる
          </button>
        </>
      )}

      {step === 1 && (
        <div className="stack">
          <div className="section">
            <h4>誰と話す？（あとで切り替えられます）</h4>
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
          </div>
          {mode === 'couple' && (
            <div className="section stack">
              <h4>2人の名前（ニックネームでOK・任意）</h4>
              <div className="field">
                <input type="text" placeholder="あなた" value={a} onChange={(e) => setA(e.target.value)} />
              </div>
              <div className="field">
                <input type="text" placeholder="相手" value={b} onChange={(e) => setB(e.target.value)} />
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                名前はこの端末の中だけに保存されます。
              </p>
            </div>
          )}
          {mode === 'friends' && (
            <div className="section stack">
              <h4>参加者</h4>
              <FriendsEditor value={friends} onChange={setFriends} />
            </div>
          )}
          <button className="btn primary block" onClick={finish}>
            カードを見る
          </button>
        </div>
      )}
    </div>
  )
}
