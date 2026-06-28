# Gemini 引き継ぎ指示書
# 岡野ファミリー Apps ポータル - GitHub Pages デプロイ

## このプロジェクトについて
個人用Webアプリポータルです。React + Vite で構築し、
GitHub Pages で無料ホスティングします。

## 現在のファイル構成
```
okano-portal/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── manifest.json         ← PWA設定
├── src/
│   ├── main.jsx
│   ├── App.jsx               ← ルーティング
│   └── pages/
│       ├── Portal.jsx        ← トップ（アプリ一覧）
│       └── Dashboard.jsx     ← 資産ダッシュボード
└── .github/
    └── workflows/
        └── deploy.yml        ← 自動デプロイ
```

## やってほしいこと（優先度順）

### 1. アイコン画像の生成（必須）
PWAアイコンを2枚生成して public/ に配置してください：
- public/icon-192.png（192×192px）
- public/icon-512.png（512×512px）
デザイン：ダークネイビー背景（#0a0f1a）に白い家のアイコン🏠
または、シンプルな「岡」の文字をゴールド（#f59e0b）で

### 2. GitHubリポジトリ作成とpush手順
以下の手順をWindows コマンドプロンプト向けに記述してください：

前提：
- GitHubアカウント名: okano-every（まだ作成していない場合は作成手順も）
- リポジトリ名: okano-every.github.io
- ローカルフォルダ: このプロジェクトフォルダ

手順：
a) Git for Windows インストール（未インストールの場合）
b) Node.js インストール確認（python3.13は導入済み）
c) GitHubリポジトリ作成
d) git init → git add → git commit → git push
e) GitHub Pages 有効化（Settings → Pages → GitHub Actions）

### 3. デプロイ確認
- push後 2〜3分で https://okano-every.github.io/ が表示される
- React Router のリフレッシュ対策（404.html）は deploy.yml に含み済み

### 4. iPhoneホーム画面への追加方法（手順書）
1. iPhoneの Safari で https://okano-every.github.io/ を開く
2. 画面下の共有ボタン（四角と矢印）をタップ
3. 「ホーム画面に追加」をタップ
4. 名前は「岡野Apps」のまま「追加」
5. ホーム画面にアイコンが出現 → タップで即起動

### 5. 今後のアプリ追加方法（説明）
新しいアプリを追加するときは：
1. src/pages/ に新しい .jsx ファイルを作成
2. src/App.jsx に Route を追加
3. src/pages/Portal.jsx の APPS 配列に追加
4. git push → 自動デプロイ

## 技術仕様
- React 18 + Vite 5
- React Router v6
- Recharts（グラフ）
- データ保存: localStorage（端末内、サーバー不要）
- スタイル: インラインCSS（Tailwind不使用）
- PWA対応: manifest.json + apple-mobile-web-app-capable

## 注意事項
- localStorage はブラウザごとに独立（iPhone Safariのデータは Safari内のみ）
- GitHub Pages は静的サイト（サーバーサイド処理なし）
- 機密データ（残高等）はlocalStorageに保存されるが外部送信なし
