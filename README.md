# 🎵 歌える曲リスト

TikTokライブ配信用のリクエスト可能な歌える曲リストWebアプリです。

## 機能

- アーティスト名・曲名でリアルタイム検索
- 50音順表示
- 最近追加した曲タブ（直近30日）
- 人気リクエストランキング（端末のブラウザごとに集計）
- ダークモード
- スマホ対応レスポンシブデザイン

---

## 曲の追加・更新方法

`data/songs.json` を編集するだけです。

```json
[
  {
    "artist": "アーティスト名",
    "title": "曲名",
    "practice": false,
    "addedDate": "2026-05-20"
  }
]
```

| フィールド | 説明 |
|---|---|
| `artist` | アーティスト名（50音順ソートに使用） |
| `title` | 曲名 |
| `practice` | `true` → 「練習中」バッジを表示、`false` → 通常表示 |
| `addedDate` | 追加日（`YYYY-MM-DD` 形式）。最近追加タブに使用 |

> **ポイント**: カンマ区切りを正確に。最後の曲データの後にカンマを付けないよう注意してください。

---

## ローカルで確認する方法

`index.html` をダブルクリックして開いても、`fetch` がブロックされてデータが読み込めません。
必ずローカルサーバー経由で確認してください。

### 方法1: npx serve（推奨）

Node.js が入っていれば:

```bash
# tiktok-song-list フォルダ内で実行
npx serve .
```

ブラウザで `http://localhost:3000` を開く

### 方法2: VS Code Live Server

VS Code に「Live Server」拡張機能をインストールし、`index.html` を右クリック → 「Open with Live Server」

---

## GitHub Pages で公開する手順

1. [GitHub](https://github.com) でリポジトリを新規作成（**Public**）
2. フォルダ内ファイルをすべてプッシュ:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
git push -u origin main
```

3. GitHub リポジトリの **Settings** → **Pages**
4. **Source** を `Deploy from a branch` にし、Branch を `main` / `/ (root)` に設定
5. 数分後に `https://ユーザー名.github.io/リポジトリ名/` で公開完了

---

## ファイル構成

```
tiktok-song-list/
├── index.html        メインページ
├── css/
│   └── style.css     スタイル（ダークモード対応）
├── js/
│   └── app.js        検索・フィルター・リクエスト集計
└── data/
    └── songs.json    ← ここを編集して曲を管理
```
