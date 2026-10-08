# CLAUDE.md

小学1・2年生向け計算練習 PWA(Vite + React 19 + TS strict)。仕様の正は `docs/requirements.md`(変更したら版を上げて更新)。ユーザーとのやりとりは日本語。

## コマンド
- `npm run dev`(5173) / `npm test`(vitest) / `npx tsc -b` / `npx oxlint` / `npm run build`
- 仕上げ前に上の4つ+`npx prettier --write "src/**/*.{ts,tsx,css}"` を通す

## 構成
- `src/domain/` 純粋ロジック: `problems.ts`(出題), `game.ts`(reducer), `stats.ts`(タイム表記), `challenge.ts`(1分チャレンジ・ランク), `modes.ts`
- `src/hooks/usePlaySession.ts` 入力・判定・正解/不正解演出の共通部分。判定は ref の最新 state で行う(連続入力でずれない)
- `src/screens/` 画面。遷移は `App.tsx` の state(ルーターなし)
- `src/storage/records.ts` localStorage `calc-lesson:v1`(`records`=れんしゅう, `challenges`=チャレンジ)。壊れたデータは捨てて読む
- グラフは `components/RecordChart.tsx`(SVG 自作)

## 決まりごと
- 子ども向け文言はひらがな+分かち書き。外来語はカタカナ(クリア, タイム)。設定画面の保護者向けだけ漢字可
- タイム: 1秒単位に四捨五入、「2ふん15びょう」。分の一の位が1,3,6,8,0なら「ぷん」(`minuteUnit`)
- 正解/不正解後の 0.3秒ロック(`LOCK_MS`)はタイム・制限時間に含めない。画面非表示中もタイマー停止
- 結果画面のボタンは画面上部(下部はタブレットのスワイプと競合)
- スマホ対応: `#root` は `100dvh`。`(max-width:600px),(max-height:520px)` で詰めたレイアウト。上書き CSS はファイル末尾に置く
- コメント・テスト名は日本語。コミットメッセージも日本語

## 確認のコツ
- ブラウザペインが隠れていると `visibilityState=hidden` でタイマーが止まる。検証時は JS で `Object.defineProperty(document,'visibilityState',{get:()=>'visible'})`
- スクリーンショットは古いことがあるので、DOM を JS で読んで確認する
- 検証で入れた localStorage の記録は最後に消す
