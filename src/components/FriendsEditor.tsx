const MIN = 2
const MAX = 8
const SIZES = [2, 3, 4, 5, 6, 7, 8]

/** 指定人数ぶんの名前配列に整える（多ければ切り、少なければ空欄を足す） */
function resize(list: string[], n: number): string[] {
  const next = list.slice(0, n)
  while (next.length < n) next.push('')
  return next
}

/**
 * 友達モードの参加者エディタ。
 * 人数を選んでから、その人数ぶんの名前を入力する。
 */
export function FriendsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const list = value.length >= MIN ? value.slice(0, MAX) : resize(value, MIN)
  const set = (i: number, v: string) => onChange(list.map((n, k) => (k === i ? v : n)))

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div>
        <h5 className="fieldlabel">何人で遊ぶ？</h5>
        <div className="chips">
          {SIZES.map((n) => (
            <button
              key={n}
              className={'chip' + (list.length === n ? ' on' : '')}
              onClick={() => onChange(resize(list, n))}
            >
              {n}人
            </button>
          ))}
        </div>
      </div>

      <div className="stack" style={{ gap: 8 }}>
        <h5 className="fieldlabel">名前（ニックネームでOK・任意）</h5>
        {list.map((n, i) => (
          <div className="person-row" key={i}>
            <label>{i + 1}人目</label>
            <input
              type="text"
              placeholder={i === 0 ? 'あなた' : `友達${i}`}
              value={n}
              onChange={(e) => set(i, e.target.value)}
              autoComplete="off"
            />
          </div>
        ))}
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        名前を入れると、カードごとにランダムで指名され、どっち派？や10点満点も人数ぶん表示されます。
        空のままなら「時計回りで順番に」になります。
      </p>
    </div>
  )
}
