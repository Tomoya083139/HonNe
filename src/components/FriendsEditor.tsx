const MAX = 8

/** 友達モードの参加者名エディタ（2〜8人） */
export function FriendsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const list = value.length >= 2 ? value : [...value, ...Array(2 - value.length).fill('')]
  const set = (i: number, v: string) => onChange(list.map((n, k) => (k === i ? v : n)))
  return (
    <div className="stack" style={{ gap: 8 }}>
      {list.map((n, i) => (
        <div className="person-row" key={i}>
          <label>{i + 1}人目</label>
          <input
            type="text"
            placeholder={i === 0 ? 'あなた' : `友達${i}`}
            value={n}
            onChange={(e) => set(i, e.target.value)}
          />
          {list.length > 2 && (
            <button className="iconbtn" aria-label="削除" onClick={() => onChange(list.filter((_, k) => k !== i))}>
              ✕
            </button>
          )}
        </div>
      ))}
      {list.length < MAX && (
        <button className="btn ghost small" onClick={() => onChange([...list, ''])}>
          ＋ 参加者を追加
        </button>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        名前を入れると、カードごとにランダムで指名されます。空のままでも遊べます。
      </p>
    </div>
  )
}
