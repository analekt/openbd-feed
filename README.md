# Book Feed Generator v3.0

RSS feed distribution service for new book information using OpenBD API - TypeScript & Vercel Edition

## 特徴

- **TypeScript**: 型安全な開発環境
- **Vercel統合**: フロントエンド・API・ストレージ・Cronすべて統合
- **Serverless**: サーバーレス関数による高速レスポンス
- **KVストレージ**: Vercel KVによる永続データ保存
- **自動更新**: 毎日午前4時の自動フィード更新

## アーキテクチャ

```
┌─────────────────── Vercel Platform ──────────────────┐
│                                                      │
│  ┌─ Frontend ─┐  ┌─ API ─┐  ┌─ Storage ─┐  ┌─ Cron ─┐ │
│  │ index.html │  │ .ts   │  │ KV Store │  │ daily  │ │
│  │ CSS/JS     │  │ funcs │  │ feeds    │  │ update │ │
│  └────────────┘  └───────┘  └──────────┘  └────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 開発環境セットアップ

```bash
# 依存関係のインストール
npm install

# TypeScript型チェック
npm run type-check

# ローカル開発サーバー起動
npm run dev

# Vercelにデプロイ
npm run deploy
```

## 技術スタック

- **TypeScript**: 型安全性
- **Vercel Functions**: サーバーレスAPI
- **Vercel KV**: Redis互換ストレージ
- **Vercel Cron**: 定期実行
- **OpenBD API**: 日本の書籍メタデータ

## 環境変数

```env
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxx
```