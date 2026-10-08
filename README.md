# けいさん ちゃれんじ

小学1・2年生向けの計算練習 Web アプリです(たしざん・ひきざん・九九)。タブレットでの利用を想定しています。
要件は [docs/requirements.md](docs/requirements.md) にまとめています。

## 使い方

```bash
npm install
npm run dev        # 開発サーバー(http://localhost:5173)
npm test           # 単体テスト
npm run build      # dist/ に静的ファイルを出力(PWA 対応)
npm run preview    # ビルド結果の確認
```

`dist/` を GitHub Pages や Netlify などに置けば、そのまま動きます(相対パスで出力しています)。
PWA に対応しているので、タブレットのホーム画面に追加すればオフラインでも使えます。

## 構成

| ディレクトリ | 内容 |
| --- | --- |
| `src/domain/` | 問題の生成、ゲームの進行(reducer)、記録の集計。UI に依存しない純粋なロジック |
| `src/storage/` | localStorage への保存・読み込みと、React の Context |
| `src/screens/` | 各画面(タイトル、九九の段選択、カウントダウン、問題、結果、設定) |
| `src/components/` | テンキー、タイムの棒グラフ、マスコットなど |
| `src/audio/` | Web Audio API で合成する効果音 |
| `src/effects/` | 紙ふぶき(canvas-confetti) |

## メモ

- 記録は `localStorage` の `calc-lesson:v1` に保存されます。設定画面から、モードごとまたはまとめて削除できます(3秒の長押しが必要です)。
- タイムには、正解・不正解のエフェクト中にテンキーを止めている時間(約0.3秒)を含めません。アプリが裏に回っているあいだもタイマーは止まります。
