# 本音（HonNe）

恋人と、友達と、ちゃんと話す時間をつくる質問カードアプリ（ブラウザ / PWA）。

- **恋人モード**: 恋人と / はじめての2人 / 将来のこと / 記念日に / 遠距離で / すれ違ったあとに
- **友達モード**: 友達と / 飲み会で / 恋バナ / はじめまして / 旅行・ドライブで / 深夜の本音
- 質問形式 8 種: 質問 / どっち派？ / 当てっこ / せーの / 10点満点 / ありがとう / お願い・約束 / ミッション
- 深さ 4 レベル（ライト → ミディアム → ディープ → 本音）を自動で深めていく出題
- お気に入り・メモ・履歴はブラウザ内（localStorage）にのみ保存。ログイン不要

設計資料: [docs/01_reference_analysis.md](docs/01_reference_analysis.md) / [docs/02_honne_design.md](docs/02_honne_design.md)

## 開発

```bash
npm install
npm run dev        # http://localhost:5173
npm run validate   # 質問 JSON の整合性チェック
npm run build      # dist/ に出力
```

## デプロイ（Netlify）

リポジトリを Netlify に接続するだけで `netlify.toml` の設定（`npm run build` → `dist`）でデプロイされます。

## 質問を追加する

`src/content/decks/<mode>/<file>.json` に追記します（`mode` は `couple` か `friends`）。

```jsonc
{
  "id": "couple_basic_046",          // <deckId>_<連番>
  "type": "open",                    // open | choice | guess | reveal | scale | thanks | wish | action
  "level": 2,                        // 1〜4
  "themes": ["love"],                // デッキの themes に含まれるもの
  "text": { "ja": "……？", "en": "...?" },
  "options": [ { "ja": "A", "en": "A" }, { "ja": "B", "en": "B" } ],  // choice のみ
  "seconds": 30,                     // action のみ
  "rating": "16+"                    // 任意
}
```

追記後は `npm run validate` で重複 ID・翻訳漏れ・未定義テーマをチェックできます。

## 構成

```
src/
├─ content/decks/{couple,friends}/*.json  質問データ
├─ content/themes.ts                      テーマ・レベル・形式のラベル
├─ session/build.ts                       出題キュー生成（レベル勾配・既出除外）
├─ components/QuestionCard.tsx            カード UI（スワイプ）
├─ components/Widgets.tsx                 形式別ウィジェット
├─ pages/                                 Onboarding / Home / DeckSetup / Session / Summary / Library / Settings
└─ store.ts                               zustand + localStorage
```
