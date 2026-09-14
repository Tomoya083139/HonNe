# 本音（HonNe）技術レポート — 仕組み・構造・技術スタック

最終更新: 2026-09-15 ／ 対象コミット: `1086b9d`

このドキュメントは「本音」がどのように動いているかを、初めてコードを読む人にも分かるように、上から下まで順に説明したものです。前半は全体像、後半は各モジュールの内部と設計判断、最後に検証内容・既知の制約・拡張方法をまとめています。

---

## 目次

1. [アプリの概要](#1-アプリの概要)
2. [技術スタック](#2-技術スタック)
3. [全体アーキテクチャ](#3-全体アーキテクチャ)
4. [ディレクトリ構成](#4-ディレクトリ構成)
5. [データモデル](#5-データモデル)
6. [コンテンツ（質問データ）の仕組み](#6-コンテンツ質問データの仕組み)
7. [画面と遷移（ルーティング）](#7-画面と遷移ルーティング)
8. [セッションの流れ](#8-セッションの流れ)
9. [出題アルゴリズム](#9-出題アルゴリズム)
10. [指名（ターン）ロジック](#10-指名ターンロジック)
11. [カード UI とスワイプ](#11-カード-ui-とスワイプ)
12. [質問形式ウィジェット](#12-質問形式ウィジェット)
13. [状態管理と永続化](#13-状態管理と永続化)
14. [スタイリングとレスポンシブ・ダークモード](#14-スタイリングとレスポンシブダークモード)
15. [PWA（オフライン・ホーム画面追加）](#15-pwaオフラインホーム画面追加)
16. [ビルド・品質チェック・デプロイ](#16-ビルド品質チェックデプロイ)
17. [テストと検証の記録](#17-テストと検証の記録)
18. [設計上の判断とトレードオフ](#18-設計上の判断とトレードオフ)
19. [既知の制約と注意点](#19-既知の制約と注意点)
20. [拡張ガイド](#20-拡張ガイド)
21. [用語集](#21-用語集)

---

## 1. アプリの概要

**本音** は、恋人や友達と「ちゃんと話す時間」をつくるための質問カードアプリです。スマホのブラウザで開いてすぐ遊べる Web アプリ（PWA）で、ログインもサーバーも不要です。

### できること

| 機能 | 内容 |
|---|---|
| 2 つのモード | **恋人モード**（2 人・名前を交互に指名）／ **友達モード**（2〜8 人・ランダム指名） |
| 12 デッキ・775 問 | 恋人 6 デッキ（恋人と／はじめての2人／将来のこと／記念日に／遠距離で／すれ違ったあとに）、友達 6 デッキ（友達と／飲み会で／恋バナ／はじめまして／旅行・ドライブで／深夜の本音） |
| 8 つの質問形式 | 質問／どっち派？／当てっこ／せーの／10点満点／ありがとう／お願い・約束／ミッション（タイマー付き） |
| 4 段階の深さ | Lv.1 ライト → Lv.2 ミディアム → Lv.3 ディープ → Lv.4 本音。セッション内で自動的に深まる |
| 出題のカスタマイズ | テーマ・深さ・枚数（5/10/20/30/無制限）・段階モードの ON/OFF |
| 記録 | お気に入り、メモ、ウィジェットの答え（誰がどう答えたか）、セッション履歴 |
| 日英併記 | すべての質問に英語訳。設定で非表示にできる |
| 16+ フィルタ | 親密さに踏み込むカードは設定で ON にしたときだけ出題 |

### 設計の前提

- **「その場で遊ぶ」が主目的**。通知・同期・アカウントなどの「あとで使う」機能は意図的に持たない。
- **1 台のスマホを回して使う**。したがって入力は最小限、タップ中心、縦持ち前提。
- **データは端末内だけ**。プライバシー面の説明が簡単で、バックエンド運用も不要。

---

## 2. 技術スタック

すべて実際にインストールされているバージョン（`package-lock.json` より）。

| 分類 | 技術 | バージョン | 役割 |
|---|---|---|---|
| 言語 | TypeScript | 6.0.3 | 型付き JavaScript。`strict` 設定 |
| UI ライブラリ | React | 19.3.0 | コンポーネント描画 |
| ルーティング | react-router-dom | 7.18.3 | 画面遷移（`HashRouter`） |
| アニメーション | framer-motion | 13.2.0 | カードのドラッグ・スワイプ・退場アニメーション |
| 状態管理 | zustand | 5.0.15 | グローバル状態 + `persist` ミドルウェアで localStorage 保存 |
| ビルド | Vite | 8.3.0 | 開発サーバー（HMR）と本番バンドル（内部は Rolldown） |
| React プラグイン | @vitejs/plugin-react | 6.1.1 | JSX 変換と Fast Refresh |
| PWA | vite-plugin-pwa（Workbox 7.4.1） | 1.3.0 | manifest 生成と Service Worker によるオフライン対応 |
| Lint | oxlint | 1.82.0 | 高速リンター（React Hooks ルール含む） |
| 実行環境 | Node.js | 24.x | ビルド・検証スクリプトの実行 |
| ホスティング | Netlify | — | 静的配信。`netlify.toml` でビルド設定 |

### なぜこの組み合わせか

- **React + TypeScript + Vite** は最も情報が多く、後から人が加わっても読める標準構成。
- **framer-motion** は「指で引っ張って離す」「閾値を超えたら飛んでいく」といったカード操作を、物理演算込みで数行で書ける。
- **zustand** は Redux より圧倒的に少ないコード量で、`persist` を付けるだけで localStorage 保存が完成する。
- **HashRouter** を選んだのは、どの静的ホスティングでも `index.html` 1 枚で動くから（`/#/home` のように URL に `#` が付く）。
- **CSS はプレーンな 1 ファイル**（Tailwind 等なし）。デザイン変数を `:root` に集約し、ダークモードも `prefers-color-scheme` で切り替えるだけの構成にして、依存を減らした。

### 依存関係の全体量

本番バンドルは **JS 577 KB（gzip 後 176 KB）＋ CSS 10 KB**。775 問の質問データ（JSON）を JS に同梱しているため、初回ロード後はネットワークなしで全機能が動きます。

---

## 3. 全体アーキテクチャ

サーバーを持たない **完全クライアントサイド SPA** です。

```
┌──────────────────────── ブラウザ ────────────────────────┐
│                                                          │
│  index.html ──▶ main.tsx ──▶ <App/> (HashRouter)         │
│                                  │                       │
│        ┌─────────────┬───────────┼───────────┬────────┐  │
│        ▼             ▼           ▼           ▼        ▼  │
│   Onboarding       Home      DeckSetup    Session   Summary / Library / Settings
│        │             │           │           │                │
│        └─────────────┴───────────┴─────┬─────┴────────────────┘
│                                        ▼
│                        zustand store (useStore)  ◀──▶  localStorage["honne-v1"]
│                                        ▲
│                         content/ (DECKS: 12 デッキ・775 問、ビルド時に同梱)
│                                        ▲
│                    session/build.ts（出題キュー）・session/people.ts（指名）
│                                                          │
│  Service Worker (Workbox) ── アプリ一式をキャッシュ → オフラインでも起動  │
└──────────────────────────────────────────────────────────┘
```

### レイヤーの分け方

| レイヤー | 場所 | 依存の向き |
|---|---|---|
| **コンテンツ** | `src/content/` | 何にも依存しない純データ + 検索関数 |
| **ドメインロジック** | `src/session/` | 型とコンテンツにだけ依存。React に依存しない純関数（テストしやすい） |
| **状態** | `src/store.ts` | zustand。UI から呼ばれる |
| **UI** | `src/pages/`, `src/components/` | 上記すべてを使う |

「ロジックは React から切り離す」を徹底しているので、出題アルゴリズムや指名ロジックは Node.js 単体で実行・検証できます（第 17 章参照）。

---

## 4. ディレクトリ構成

```
HonNe/
├─ index.html                 エントリ HTML（viewport / theme-color / アイコン）
├─ vite.config.ts             Vite + React + PWA プラグイン設定
├─ netlify.toml               Netlify のビルド設定と SPA リダイレクト
├─ package.json               scripts: dev / build / lint / validate / icons / preview
├─ tsconfig*.json             TypeScript 設定（app / node の 2 系統）
├─ .oxlintrc.json             Lint 設定
├─ .claude/launch.json        開発・プレビューサーバーの起動定義
│
├─ public/
│  └─ icons/                  PWA アイコン（svg / 192px / 512px）
│
├─ scripts/
│  ├─ validate-content.mjs    質問 JSON の整合性チェック（CI 相当）
│  └─ gen-icons.mjs           SVG から PNG アイコンを生成
│
├─ docs/
│  ├─ 01_reference_analysis.md   参考アプリ（Sekirara）の分析
│  ├─ 02_honne_design.md         本音の設計ドキュメント
│  └─ 03_technical_report.md     本書
│
└─ src/
   ├─ main.tsx                React のマウント（StrictMode）
   ├─ App.tsx                 ルート定義
   ├─ index.css               全スタイル（デザイン変数・レイアウト・カード・ウィジェット）
   ├─ types.ts                共通の型定義
   ├─ store.ts                zustand ストア（永続化）
   │
   ├─ content/
   │  ├─ index.ts             デッキ JSON を一括読込・検索
   │  ├─ themes.ts            テーマ / レベル / 形式のラベル（日英）
   │  └─ decks/
   │     ├─ couple/01_basic.json … 06_repair.json     恋人 6 デッキ
   │     └─ friends/01_basic.json … 06_night.json     友達 6 デッキ
   │
   ├─ session/
   │  ├─ build.ts             出題キュー生成（フィルタ・既出除外・レベル勾配）
   │  └─ people.ts            参加者名の解決と指名割り当て
   │
   ├─ components/
   │  ├─ QuestionCard.tsx     カード本体（ドラッグ・スワイプ・退場）
   │  ├─ Widgets.tsx          形式別の操作 UI（どっち派・せーの・10点・当てっこ・ミッション・メモ）
   │  └─ FriendsEditor.tsx    友達モードの参加者名エディタ
   │
   └─ pages/
      ├─ Onboarding.tsx       初回の約束ごと + モード / 名前入力
      ├─ Home.tsx             モード切替 + デッキ一覧 + 下部ナビ
      ├─ DeckSetup.tsx        テーマ・深さ・枚数の選択
      ├─ Session.tsx          出題画面（進行・集計・保存）
      ├─ Summary.tsx          終了後のまとめ
      ├─ Library.tsx          お気に入り / 答え / 履歴
      └─ Settings.tsx         名前・参加者・表示設定・データ削除
```

コード量の目安: TypeScript/TSX 約 1,600 行、CSS 約 750 行、質問 JSON 775 エントリ。

---

## 5. データモデル

すべて [src/types.ts](../src/types.ts) に定義。

### Card（1 枚の質問）

```ts
interface Card {
  id: string            // "couple_basic_012" — <deckId>_<3桁連番>
  type: CardType        // 'open' | 'choice' | 'guess' | 'reveal' | 'scale' | 'thanks' | 'wish' | 'action'
  level: 1 | 2 | 3 | 4  // 深さ
  themes: string[]      // デッキの themes に含まれるキー（例: ['love', 'daily']）
  text: { ja: string; en: string }
  options?: { ja: string; en: string }[]  // choice のみ（2〜4 択）
  seconds?: number                        // action のみ（タイマー秒数）
  rating?: 'all' | '16+'                  // 16+ は設定 ON のときだけ出題
}
```

### Deck（デッキ）

```ts
interface Deck {
  id: string; mode: 'couple' | 'friends'
  name: LText; tagline: LText
  color: string        // デッキのテーマカラー（CSS 変数 --deck に流し込む）
  themes: string[]     // このデッキで使えるテーマキー
  cards: Card[]
}
```

### SessionConfig（出題条件）

`DeckSetup` で作られ、`Session` に `location.state` として渡されます。

```ts
interface SessionConfig {
  deckId: string
  themes: string[]     // 空 = すべて
  levels: Level[]      // 出題する深さ
  count: number        // 0 = 無制限
  gradient: boolean    // true: ライト→本音の順に並べる
}
```

### 保存される記録

```ts
interface AnswerRecord {   // ウィジェットの答え・メモ
  cardId: string; deckId: string; at: string  // ISO 日時
  memo?: string
  values?: string[]        // "とも: 顔" のように名前付き
  result?: 'hit' | 'miss'  // 当てっこの結果
}

interface SessionRecord {  // 1 回のセッション
  id: string; deckId: string; mode: Mode
  startedAt: string; endedAt?: string
  answered: number; passed: number; hits: number; misses: number
}
```

### 型の関係

```
Deck 1 ──▶ * Card
SessionConfig ──(deckId)──▶ Deck
AnswerRecord ──(cardId)──▶ Card
SessionRecord ──(deckId)──▶ Deck
Profile { mode, names[2], friends[], showEnglish, adult, onboarded }
```

---

## 6. コンテンツ（質問データ）の仕組み

### ファイル形式

1 デッキ = 1 JSON ファイル。ヘッダーの下に「1 カード 1 行」で並べ、差分レビューしやすくしています。

```jsonc
{
  "id": "friends_party",
  "mode": "friends",
  "name": {"ja":"飲み会で","en":"Night Out"},
  "tagline": {"ja":"盛り上がる。でもちょっと本音も出る。","en":"..."},
  "color": "#F2A33A",
  "themes": ["fun","icebreak","romance","daily","past","feelings"],
  "cards": [
    {"id":"friends_party_001","type":"open","level":1,"themes":["fun"],"text":{"ja":"...","en":"..."}},
    {"id":"friends_party_002","type":"choice","level":1,"themes":["fun"],"text":{...},"options":[{"ja":"..","en":".."},...]},
    ...
  ]
}
```

### 読み込み方法

[src/content/index.ts](../src/content/index.ts) が Vite の `import.meta.glob` で `decks/*/*.json` を **ビルド時に** 一括取り込みします。ファイルを追加するだけでデッキが増え、登録作業は不要です。

```ts
const modules = import.meta.glob<Deck>('./decks/*/*.json', { eager: true, import: 'default' })
export const DECKS = Object.keys(modules).sort().map((k) => modules[k])   // ファイル名順
```

ファイル名の先頭 2 桁（`01_`, `02_`…）が Home での表示順になります。

### 品質を守る仕組み — `npm run validate`

[scripts/validate-content.mjs](../scripts/validate-content.mjs) が以下を検査し、1 件でも問題があれば終了コード 1 で失敗します。

- ID の重複／`<deckId>_` で始まっているか
- `type` が 8 種のいずれか、`level` が 1〜4
- 日本語・英語テキストの欠落
- **質問文（ja）の重複**（デッキをまたいでも検出）
- カードの `themes` がデッキの `themes` に宣言されているか
- `choice` は選択肢 2 つ以上、`action` は `seconds` 必須
- フォルダ名（couple/friends）と `mode` の一致

### 収録数の内訳（775 問）

| 恋人 | 枚数 | 友達 | 枚数 |
|---|---|---|---|
| 恋人と | 92 | 友達と | 85 |
| はじめての2人 | 71 | 飲み会で | 70 |
| 将来のこと | 65 | 恋バナ | 63 |
| 記念日に | 55 | はじめまして | 60 |
| 遠距離で | 55 | 旅行・ドライブで | 56 |
| すれ違ったあとに | 45 | 深夜の本音 | 58 |

各デッキは Lv.1 が最も多く Lv.4 が最も少ないピラミッド型で、形式は `open` が約 7 割、残りを他 7 形式に振り分けています。

### ラベル辞書

[src/content/themes.ts](../src/content/themes.ts) にテーマ（16 種）、レベル（4 段階）、形式（8 種）、モードの日英ラベルを集約。UI はここから表示名を引くので、キーを変えずに表記だけ変えられます。

---

## 7. 画面と遷移（ルーティング）

[src/App.tsx](../src/App.tsx) の `HashRouter` で定義。

| パス | 画面 | 役割 |
|---|---|---|
| `/` | Root | 初回なら Onboarding、済みなら `/home` へ |
| `/home` | Home | モード切替（恋人／友達）、デッキ一覧、進捗（既出/総数） |
| `/deck/:id` | DeckSetup | テーマ・深さ・枚数・段階モードの選択、既出リセット |
| `/session` | Session | 出題。`location.state` に SessionConfig が必須 |
| `/summary` | Summary | 集計と今日の記録。`state.sessionId` が必須 |
| `/library` | Library | お気に入り／答え／履歴の 3 タブ |
| `/settings` | Settings | 名前・参加者・英語表示・16+・全削除 |
| `*` | — | `/` へ |

### 遷移図

```
Onboarding ──▶ Home ◀──────────────────────────┐
                │  ▲                            │
                ▼  │(戻る)                       │
            DeckSetup ──はじめる──▶ Session ──▶ Summary
                ▲                     │            │
                └────── もう一回 ───────┘   ホームへ ┘
Home ◀─▶ Library ◀─▶ Settings   （下部ナビで相互移動）
```

### 状態がない直リンクの扱い

`/session` や `/summary` を state なしで開いた場合（URL を直接叩く・共有リンクなど）は `<Navigate to="/home" replace />` で Home に戻します。当初は描画中に `navigate()` を呼んでいて白画面で止まるバグがあり、修正済みです。

一方、**セッション中のリロード**は react-router が `history.state` に SessionConfig を保存しているため、同じ条件で 1 枚目からやり直せます。

---

## 8. セッションの流れ

[src/pages/Session.tsx](../src/pages/Session.tsx) が中心。1 セッションのライフサイクルは次の通りです。

```
DeckSetup「はじめる」
   │  nav('/session', { state: cfg })
   ▼
Session マウント
   ├─ seenAtStart = 既出 ID の snapshot（セッション中に増えても再計算しない）
   ├─ queue  = buildQueue(deck, cfg, seenAtStart, adult)   … useMemo（deck.id が変わらない限り固定）
   ├─ people = participants(mode, names, friends)           … 参加者名
   ├─ turns  = assignTurns(mode, people, queue)             … カードごとの指名を先に確定
   └─ startSession({ id: Date.now(), ... })                 … 履歴に仮登録（冪等）
   │
   ▼  カードごとのループ
   ├─ 表示: queue[idx]（前面）と queue[idx+1]（背面・操作不可）
   ├─ ユーザー操作: ウィジェット入力 → draft（memo / values / result）に一時保存
   ├─ 右スワイプ or「次のカード」→ advance('next')
   │     ├─ markSeen(deck, card)
   │     ├─ stats.answered++（当てっこなら hits / misses も）
   │     └─ draft に何か入っていれば saveAnswer({ cardId, at, memo, values: "名前: 値", result })
   ├─ 左スワイプ or「パス」→ advance('pass')
   │     ├─ markSeen
   │     └─ stats.passed++（答えは保存しない）
   └─ idx+1 >= queue.length なら finish()
   │
   ▼
finish()  … updateSession({ endedAt, ...stats }) → nav('/summary', { state: { sessionId } })

（✕ ボタン・ブラウザバックなどで途中離脱した場合）
   └─ アンマウント時に closeIfAbandoned() が同じ内容を記録する
```

### 集計を `useRef` にしている理由

`stats` はカードごとに書き換わりますが、その値で画面を再描画する必要はありません。`useState` にすると毎回カード全体が再レンダリングされ、アニメーション中にちらつく可能性があるため、`useRef` に溜めて終了時にまとめて保存しています。

### 「既出」の扱い

- `seen[deckId]` は「一度でも画面に出したカード ID」のリスト。パスしても既出扱い。
- セッション開始時のスナップショットを使うので、同じセッション内で同じカードが二度出ることはありません。
- DeckSetup の「既出をリセット」で空にできます。

---

## 9. 出題アルゴリズム

[src/session/build.ts](../src/session/build.ts) の `buildQueue`。React に依存しない純関数です。

### 手順

```
1. pool  = deck.cards を条件でフィルタ
           ・level が cfg.levels に含まれる
           ・cfg.themes が空、または themes が 1 つでも一致
           ・adult=false なら rating '16+' を除外
2. fresh = pool のうち未出題（seen に含まれない）
3. target = cfg.count（0 なら pool.length）

4a. gradient = true（既定）
      picked = pickByLevel(shuffle(fresh), levels, target)       ← まず未出題だけで
      足りなければ picked += pickByLevel(shuffle(既出), levels, 残り)
      picked を level 昇順に安定ソート                            ← ライト → 本音 の勾配
4b. gradient = false
      picked = shuffle(fresh) → 足りなければ shuffle(既出) を後ろに → target で切る
```

### `pickByLevel` — レベル均等配分

```
quota = ceil(target / levels.length)      例: 10 枚・4 レベル → 3 枚ずつ
各レベルから quota 枚まで取り、余りは leftovers へ
picked が target に届かなければ leftovers から補充（あるレベルが薄いときの救済）
```

こうすると「10 枚」なら Lv.1〜4 がだいたい 3:3:2:2 のように並び、会話が自然に深まっていきます。

### 修正済みの不具合（監査で発見）

以前は「レベルごとの枠」を**未出題と既出を混ぜたリスト**から埋めていたため、あるレベルの未出題が少ないと、他のレベルに未出題が残っていても既出が選ばれることがありました。現在は「未出題を全体で使い切ってから既出」に変更しています（第 17 章のテストケース「prefers unseen」）。

### `countAvailable`

DeckSetup の「条件に合うカード N 枚（うち既出 M 枚）」表示用。`buildQueue` と同じフィルタを通した母集団で数えます。

---

## 10. 指名（ターン）ロジック

[src/session/people.ts](../src/session/people.ts)。

### `participants(mode, names, friends)` — 誰が参加しているか

| モード | 結果 |
|---|---|
| couple | `[names[0] or 'あなた', names[1] or '相手']` |
| friends（名前 2 人以上） | 空欄を除いた名前。**同名は `A`, `A2`, `A3` と番号付け**（指名・集計の混同防止） |
| friends（名前 1 人以下） | `['あなた', '相手']` にフォールバックし、ターン表示は「時計回りで順番に答えよう」 |

### `assignTurns(mode, people, queue)` — カードごとの指名

セッション開始時に全カード分を先に決めます（表示のたびに乱数を引くと、再レンダリングで指名が変わってしまうため）。

```
for 各カード i:
  first  = couple なら i % 2（交互）
           friends なら「直前と違う人」からランダム
  second = first 以外からランダム（ありがとう / お願い の相手）
```

### 画面上の見せ方（Session の `turnLine`）

| 形式 | 恋人 | 友達（名前あり） |
|---|---|---|
| 通常 | **とも** が最初に答える番 | **けん** から時計回りに |
| 当てっこ | **みお** が **とも** の答えを予想 | **とも** の答えをみんなで予想 |
| ありがとう／お願い | **とも** → **みお** へ | **みお** → **さくら** へ |

---

## 11. カード UI とスワイプ

[src/components/QuestionCard.tsx](../src/components/QuestionCard.tsx)。

### 構造

```
<motion.div class="card" drag="x" style={{ x, rotate }}>
  <div class="wave">   ♡お気に入り   Lv バッジ   波形 SVG   </div>
  <div class="body">   形式バッジ / 質問 / 英訳 / [interact: ウィジェット + メモ] / ロゴ </div>
</motion.div>
```

前面カードと背面カード（次のカード）を同じコンポーネントで描画し、背面は `back` プロップで `scale: .95, y: 12`・操作不可にしています。`key={card.id}` なので、カードが進むと背面の要素がそのまま前面に昇格し、`initial → animate` で自然に大きくなります。

### スワイプの判定

```ts
onDragEnd: (_, info) => {
  if (info.offset.x > 110 || info.velocity.x > 600)  swipe('next')   // 右 → 次へ
  else if (info.offset.x < -110 || info.velocity.x < -600) swipe('pass')  // 左 → パス
  else animate(x, 0, spring)                                            // 戻す
}
```

`x` は framer-motion の `MotionValue`。`rotate` は `useTransform(x, [-250, 250], [-12, 12])` で、引っ張るほど傾きます。

### 退場アニメーションの設計

```ts
const swipe = (dir) => {
  if (leaving) return            // 二重発火防止
  setLeaving(true)
  animate(x, dir === 'next' ? 600 : -600, { duration: 0.22 })
  window.setTimeout(() => p.onSwipe(dir), 230)   // Promise ではなく時間で確定
}
```

当初は `animate(...).then(...)` に頼っていましたが、`dragConstraints` がプログラム側のアニメーションを止めて Promise が解決しないケースがあり、**カードが進まなくなる**バグが出ました。現在は制約を外し、時間ベースで確実に次へ進めています。

### ウィジェット領域とドラッグの分離

スライダーやテキスト入力を横に動かすとカードごとスワイプされてしまうため、ウィジェットとメモを包む `.interact` で `onPointerDownCapture={e => e.stopPropagation()}` し、framer-motion にポインタイベントを渡しません。CSS でも `input[type=range] { touch-action: none }` を指定しています。

### 本文のスクロール

4 人分のスライダーやメモを開くとカードの高さを超えるため、`.body` は `overflow-y: auto`。「スクロールできることが分からない」問題には、`background-attachment: local` を使った **スクロール影**（上下端に薄い影が出て、端に達すると消える）で対処しています。JS 不要の CSS だけの手法です。

---

## 12. 質問形式ウィジェット

[src/components/Widgets.tsx](../src/components/Widgets.tsx)。すべて `WidgetProps { card, people, turn, showEnglish, onValues, onResult }` を受け取ります。

| 形式 | コンポーネント | 動き | 保存されるもの |
|---|---|---|---|
| どっち派？ `choice` | `ChoiceWidget` | 参加者チップを選び→選択肢をタップ。未回答の人へ自動で移る。全員回答で判定表示：2 人なら「一致！／違う派！」、3 人以上なら「多数派は「X」(3人)。少数派の A に理由を聞こう」 | `values`（人ごとの選択） |
| せーの `reveal` | `RevealWidget` → `RevealInputs` | 人数分の入力欄をぼかして表示 → 「せーの！で公開」で一斉に見せる。全員一致なら祝福 | `values` |
| せーので指さし `reveal`（文中に「指さし」） | `PointWidget` | 入力は出さず、3・2・1・「せーの！」のカウントダウンだけ | なし |
| 10点満点 `scale` | `ScaleWidget` | 人数分のスライダー。差 1 以内で「ほぼ同じ感覚」、それ以上は最高／最低の人と点差 | `values` |
| 当てっこ `guess` | `GuessWidget` | 「A が B の答えを予想 → B が発表」の案内と ⭕／❌。3 人以上は「誰か当てた／全員はずれ」 | `result` |
| ミッション `action` | `ActionWidget` | `seconds` のカウントダウンタイマー。スタート／一時停止／リセット | なし |
| ありがとう `thanks`／お願い `wish`／質問 `open` | — | ウィジェットなし。ターン表示で相手を指名 | メモのみ |
| （共通）メモ | `MemoWidget` | 「メモを残す」で textarea を開く | `memo` |

各ウィジェットは自分のローカル state で入力を持ち、変化のたびに `onValues` / `onResult` で親（Session の `draft`）へ通知します。カードが進むと `key` が変わって state ごと捨てられるため、前のカードの入力が残ることはありません。

---

## 13. 状態管理と永続化

[src/store.ts](../src/store.ts)。zustand の `create` + `persist`。

### ストアの形

```ts
{
  profile: { onboarded, mode, names: [a, b], friends: string[], showEnglish, adult },
  seen:      { [deckId]: cardId[] },   // 既出
  favorites: cardId[],
  answers:   AnswerRecord[],
  sessions:  SessionRecord[],
  // actions
  setProfile, markSeen, resetSeen, toggleFavorite, saveAnswer,
  startSession, updateSession, clearAll
}
```

### 永続化

- キーは `localStorage["honne-v1"]`。すべての `set()` 後に自動で JSON 保存。
- **後方互換**: `merge` オプションで `profile` を `{ ...初期値, ...保存値 }` とマージ。古いデータに `friends` が無くても壊れません（監査で実機確認済み）。
- **冪等性**: `startSession` は同じ ID が既にあれば追加しない（React StrictMode の二重実行対策）。`markSeen` も重複を追加しない。

### コンポーネントからの読み方

```ts
const favorites = useStore((s) => s.favorites)          // 必要な部分だけ購読
const seen = useStore((s) => s.seen[id]) ?? EMPTY       // 未定義時は「同じ参照の空配列」
```

セレクタが毎回新しい配列を返すと React が無限再レンダリングになる（`getSnapshot should be cached` エラー）ため、フォールバックはモジュールスコープの定数 `EMPTY` を使っています。開発中に実際にこの無限ループが起きて修正した箇所です。

### データ削除

Settings の「すべてのデータを削除」は `clearAll()` で初期状態に戻し、`location.href = '/'` でオンボーディングからやり直します。

---

## 14. スタイリングとレスポンシブ・ダークモード

[src/index.css](../src/index.css) 1 ファイル。

### デザイントークン

```css
:root {
  --bg / --surface / --text / --muted / --line   基本色
  --accent: #e0455a                              ブランド色（本音の赤）
  --shadow / --radius / --font
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) { :root { …暗色に上書き… } }
```

デッキごとの色は React 側で `style={{ '--deck': deck.color }}` を流し込み、カードの波形・バッジ・ボタン・スライダーの `accent-color` などが自動で追従します。

### レイアウト

- `.shell` … 最大幅 480px の中央寄せ。`padding-top/bottom` に `env(safe-area-inset-*)` を使い、ノッチ・ホームバーを避ける。
- `.stage` / `.cardarea` … flex で残り高さいっぱいにカードを広げ、`min-height: 400px` で 667px 級の端末でもボタンが切れない。
- 下部ナビ `.bottomnav` は `position: sticky; bottom: 0`。

### スマホ向けの細かい配慮

| 項目 | 対応 |
|---|---|
| iOS の入力フォーカス時ズーム | 入力は 16px（本文サイズ）を継承。13px 以下の入力を作らない |
| タップ時の灰色フラッシュ | `-webkit-tap-highlight-color: transparent` |
| 横スクロールの発生 | `body { overflow-x: hidden }`、カードは `touch-action: pan-y` |
| 引っ張って更新の誤発火 | `overscroll-behavior-y: none` |
| ボタンの押しやすさ | 主要ボタンは高さ 48px 以上、チップは 36px 以上 |
| 長い質問文 | `.q` は 21px / line-height 1.5、本文はスクロール可（スクロール影付き） |

### 確認済みの表示環境

375×812（iPhone 12 系）、375×667（iPhone SE 系）、ライト／ダーク両方。

---

## 15. PWA（オフライン・ホーム画面追加）

[vite.config.ts](../vite.config.ts) の `VitePWA` で設定。

- **manifest**: 名前「本音 - 質問カード」、`display: standalone`（ホーム画面から開くとブラウザ UI なし）、テーマ色、アイコン 3 種（SVG / 192 / 512）。
- **Service Worker**: Workbox の precache。ビルド成果物（HTML / JS / CSS / アイコン）をすべてキャッシュするため、一度開けば圏外でも起動・全機能が使えます。
- **更新方式**: `registerType: 'autoUpdate'`。新しいバージョンをデプロイすると、次回起動時にバックグラウンドで取得し、**その次の起動**で反映されます（1 回目は旧版のまま動く）。

---

## 16. ビルド・品質チェック・デプロイ

### npm scripts

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー（HMR）。`http://localhost:5173` |
| `npm run build` | `tsc -b`（型チェック）→ `vite build`。`dist/` に出力 |
| `npm run preview` | `dist/` を本番同様に配信（`http://localhost:4173`） |
| `npm run validate` | 質問 JSON の検査（第 6 章） |
| `npm run lint` | oxlint（React Hooks ルール含む） |
| `npm run icons` | `public/icons/icon.svg` から PNG を生成 |

### 型・Lint の設定

- `tsconfig.app.json` は `strict`、`noUnusedLocals`、`noUnusedParameters`、`verbatimModuleSyntax` を有効化。
- oxlint は `react-hooks/exhaustive-deps` を含むルールセット。現在 **警告 0**（唯一の `only-export-components` は Fast Refresh 向けの注意で無効化済み）。

### デプロイ（Netlify）

`netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

GitHub リポジトリを Netlify に接続すれば、`git push` ごとに自動ビルド・公開されます。HashRouter なのでリダイレクト設定は保険です（`/` 以外を直接叩かれても `index.html` を返す）。

### 開発・プレビュー起動定義

`.claude/launch.json` に `honne-dev`（5173）と `honne-preview`（4173）を定義。プレビューは本番バンドルでの動作確認に使います。

---

## 17. テストと検証の記録

このプロジェクトは自動テストフレームワークを導入せず、**(a) 静的検査、(b) ロジックのスクリプト検証、(c) ブラウザでの E2E 操作** の 3 層で品質を確認しています。

### (a) 静的検査（クリーン環境で実施）

`node_modules` を削除 → `npm ci` → `validate` / `tsc -b` / `oxlint` / `vite build` をすべて実行し、**エラー 0・警告 0・ビルド成功**を確認。

### (b) ロジック検証（19 ケース・全 PASS）

`src/session/build.ts` と `people.ts` を `tsc` で単体コンパイルし、Node.js で以下を検証しました。

| 対象 | ケース |
|---|---|
| `buildQueue` | 指定枚数どおり／16+ 除外／段階モードでレベルが非減少／ID 重複なし／**未出題を優先**／無制限は全枚数／テーマ+レベル+16+ の複合フィルタ／枚数が母集団を超えたら丸める／レベル未選択は 0 枚 |
| `countAvailable` | `buildQueue` の母集団と一致 |
| `participants` | 恋人の既定ラベル／友達の空欄フォールバック／1 人だけのフォールバック／**同名を一意化** |
| `assignTurns` | 枚数一致／直前と同じ人を避ける／second ≠ first／全員が実在の名前／恋人は厳密に交互 |

「未出題を優先」は最初 FAIL となり、第 9 章のアルゴリズム修正につながりました。

### (c) ブラウザ E2E（本番ビルド `npm run preview` 上）

| シナリオ | 結果 |
|---|---|
| オンボーディング → 友達モード 4 人登録 → 85 枚を全ウィジェット操作しながら完走 → サマリー | 話した 73／パス 12 で集計一致、コンソールエラー 0 |
| お気に入り・メモ・答えの保存 → サマリー・記録に反映 | OK（答えは「とも: 顔 ／ みお: 声」の名前付き） |
| 恋人モードで交互ターン、当てっこ・ありがとうの指名表示 | OK |
| `/session` `/summary` への state なし直リンク | Home へリダイレクト |
| セッション中リロード | 同条件で再開 |
| ✕ を押さず離脱 | 履歴にそこまでの集計が残る（0 枚は非表示） |
| 旧データ（`friends` なし）での起動 | 正常（マージで補完） |
| 375×812 / 375×667、ライト／ダーク | 崩れなし、ボタン欠けなし |
| PWA | manifest 配信、Service Worker 登録、更新後の反映 |

### 開発中に発見・修正した主な不具合（時系列）

1. zustand セレクタの空配列フォールバックで無限再レンダリング
2. `EMPTY` 定数の未定義参照（上記修正時の取りこぼし）
3. `dragConstraints` により退場アニメーションが止まりカードが進まない
4. 直リンク時に描画中 `navigate()` で白画面
5. 段階モードで既出が未出題より先に選ばれる
6. 同名参加者の混同
7. スライダー操作がカードスワイプを誤発火
8. 「指さし」カードに無意味なテキスト入力
9. 本文スクロールの視認性不足
10. 途中離脱セッションが「話した 0 枚」で残る
11. 複数人の答えが誰のものか分からない
12. StrictMode でのセッション二重登録（開発時のみ）
13. 恋人モードの当てっこで「みんなで予想」と表示
14. デッキ設定の既出数が絞り込み前の値

---

## 18. 設計上の判断とトレードオフ

| 判断 | 採った側 | 捨てた側と理由 |
|---|---|---|
| バックエンドなし | localStorage のみ | 端末間同期・ペア共有はできないが、運用コスト 0・プライバシー説明が容易 |
| HashRouter | `/#/home` 形式 | URL は少し不格好だが、どの静的ホスティングでも設定不要 |
| 質問データを JS に同梱 | オフライン即動作 | バンドルが 577KB に。gzip 後 176KB なので許容。将来はデッキ単位の遅延読込も可能 |
| 自動テストフレームワーク未導入 | スクリプト検証 + 手動 E2E | 規模（約 1,600 行）に対して十分。Vitest 導入時は `session/*.ts` がそのままテスト対象になる |
| プレーン CSS | 依存ゼロ・750 行 | ユーティリティ CSS の速さは失うが、デザイン変数 + 少数のクラスで足りる |
| ウィジェット state をカード内に閉じる | `key` で自動破棄 | 「前のカードに戻って編集」はできない（仕様として不要） |
| 指名を開始時に一括決定 | 再描画で変わらない | 途中で参加者を増やせない（設定で変更後、次のセッションから反映） |

---

## 19. 既知の制約と注意点

- **データは端末・ブラウザ単位**。別の端末や、同じ端末でも別ブラウザ／シークレットモードでは共有されません。ブラウザのサイトデータ削除で消えます。
- **PWA 更新は 2 回目の起動で反映**（第 15 章）。
- **カード内の入力はスマホのキーボードで行う**ため、大人数の「せーの」入力は時間がかかります。大人数では「指さし」形式の方が向いています。
- **既出の記録はカード ID 単位**。質問文を書き換えても ID が同じなら既出扱いのままです。内容を大きく変えるときは新しい ID を振ってください。
- **友達モードの質問文に含まれる「相手」**は、指名された人に対して「隣の人」「みんな」と読み替えて運用する前提です。
- **バンドルサイズ警告**（Vite の 500KB しきい値）は出ますが動作に影響はありません。

---

## 20. 拡張ガイド

### 質問を足す

1. `src/content/decks/<mode>/<file>.json` の `cards` 末尾に 1 行追加（ID は連番、`themes` はデッキの `themes` から）。
2. `npm run validate` で検査。
3. 新しいテーマキーを使うときは `themes.ts` にラベルを追加し、デッキの `themes` にも宣言。

### デッキを足す

`decks/<mode>/07_xxx.json` を作るだけ。`id`・`mode`・`name`・`tagline`・`color`・`themes`・`cards` を揃えれば Home に自動で並びます。

### 質問形式を足す

1. `types.ts` の `CardType` に追加。
2. `themes.ts` の `TYPE_LABEL`、`QuestionCard.tsx` の `TYPE_ICON` にラベルとアイコン。
3. `Widgets.tsx` にコンポーネントを書き、`QuestionCard.tsx` の `switch` に分岐を追加。
4. `validate-content.mjs` の `TYPES` に追加（必須フィールドがあれば検査も）。

### 自動テストを導入する

`npm i -D vitest` の後、第 17 章 (b) のケースを `src/session/*.test.ts` に移せばそのまま動きます（純関数なので DOM 不要）。

### 将来の候補（現時点では対象外）

- ランダム 1 問モード（Home から 1 タップ）
- サイコロで最初の人を決める演出
- セッション中の「もっと深く／軽く」
- 新デッキ（恋人「同棲・結婚前に」、友達「もしも〜だったら？」）

---

## 21. 用語集

| 用語 | 意味 |
|---|---|
| デッキ | テーマごとの質問の束（例: 飲み会で）。1 JSON ファイル |
| カード | 1 問。8 つの形式のいずれか |
| レベル／深さ | Lv.1 ライト〜Lv.4 本音。質問の踏み込み度 |
| 段階モード（gradient） | セッション内でレベル昇順に並べる出題方式 |
| 既出（seen） | 一度画面に出したカード。次回以降は後回し |
| セッション | 「はじめる」から「終了」まで。履歴 1 件に対応 |
| 指名（turn） | そのカードで最初に答える人／相手 |
| ウィジェット | 形式ごとの操作 UI（選択肢・スライダーなど） |
| SPA | 1 枚の HTML で画面を切り替える Web アプリ |
| PWA | ホーム画面に追加でき、オフラインでも動く Web アプリ |
| Service Worker | ブラウザ内でファイルをキャッシュし、オフライン起動を可能にする仕組み |
| zustand | 軽量な状態管理ライブラリ |
| framer-motion | React 向けアニメーション／ジェスチャーライブラリ |
