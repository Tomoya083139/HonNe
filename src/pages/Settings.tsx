import { DECKS } from '../content'
import { useStore } from '../store'
import { BottomNav } from './Home'

export default function Settings() {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const clearAll = useStore((s) => s.clearAll)
  const totalCards = DECKS.reduce((n, d) => n + d.cards.length, 0)

  return (
    <div className="shell">
      <div className="topbar">
        <h1>設定</h1>
      </div>

      <div className="section stack">
        <h4>恋人モードの名前</h4>
        <div className="field">
          <input
            type="text"
            placeholder="あなた"
            value={profile.names[0]}
            onChange={(e) => setProfile({ names: [e.target.value, profile.names[1]] })}
          />
        </div>
        <div className="field">
          <input
            type="text"
            placeholder="相手"
            value={profile.names[1]}
            onChange={(e) => setProfile({ names: [profile.names[0], e.target.value] })}
          />
        </div>
      </div>

      <div className="section stack">
        <label className="toggle">
          <span>
            英語も表示する
            <div className="small muted">外国籍のパートナー・友達と使うとき</div>
          </span>
          <input
            type="checkbox"
            checked={profile.showEnglish}
            onChange={(e) => setProfile({ showEnglish: e.target.checked })}
          />
        </label>
        <label className="toggle">
          <span>
            16+ のカードを含める
            <div className="small muted">親密さ・体の話など、踏み込んだ質問</div>
          </span>
          <input type="checkbox" checked={profile.adult} onChange={(e) => setProfile({ adult: e.target.checked })} />
        </label>
      </div>

      <div className="section">
        <h4>このアプリについて</h4>
        <p className="small muted" style={{ margin: 0 }}>
          本音 ver 0.1 ・ 収録 {DECKS.length} デッキ / {totalCards} 枚。
          データはすべてこの端末（ブラウザ）内にのみ保存されます。
        </p>
      </div>

      <div className="spacer" />
      <button
        className="btn ghost block"
        onClick={() => {
          if (confirm('お気に入り・メモ・履歴をすべて削除します。よろしいですか？')) {
            clearAll()
            location.href = '/'
          }
        }}
      >
        すべてのデータを削除
      </button>
      <BottomNav />
    </div>
  )
}
