# New Book RSS Generator v3.0 - プロジェクト情報

## 📋 プロジェクト概要

**サービス名**: New Book RSS Generator v3.0  
**URL**: https://openbd.vercel.app/  
**技術スタック**: TypeScript + Vercel Serverless Functions  
**リポジトリ**: https://github.com/analekt/openbd-feed  

OpenBD APIを使用して日本の新刊書籍情報をユーザー指定条件でフィルタリングし、RSSフィードとして配信するサービスです。

## 🏗️ アーキテクチャ

### 現在の構成
```
┌─────────────── Vercel Platform ───────────────┐
│                                               │
│  Frontend         API              Storage    │
│  ┌─────────┐    ┌─────────────┐   ┌─────────┐ │
│  │ HTML    │    │ create-     │   │ Simple  │ │
│  │ CSS     │ ←→ │ feed.ts     │ ←→│ Storage │ │
│  │ JS      │    │ feeds/[id]  │   │ (Memory)│ │
│  └─────────┘    │ feeds/index │   └─────────┘ │
│                 │ update-feeds│               │
│                 └─────────────┘               │
└───────────────────────────────────────────────┘
```

### ディレクトリ構造
```
├── api/                    # Vercel Serverless Functions
│   ├── create-feed.ts      # フィード作成API
│   ├── update-feeds.ts     # 定期更新API（未実装）
│   └── feeds/
│       ├── [id].ts         # RSS配信API
│       └── index.ts        # フィード一覧API
├── lib/                    # 共通ライブラリ
│   ├── openbd-client.ts    # OpenBD APIクライアント
│   ├── book-matcher.ts     # 書籍マッチングロジック
│   ├── rss-generator.ts    # RSS生成エンジン
│   ├── feed-updater.ts     # フィード更新処理
│   ├── storage-simple.ts   # 簡易ストレージ（現在使用）
│   └── storage-edge.ts     # Edge Config + Blob（未使用）
├── types/                  # TypeScript型定義
│   ├── openbd.ts          # OpenBD API型
│   ├── feed.ts            # フィード関連型
│   └── index.ts           # 型エクスポート
├── public/                 # 静的ファイル
│   ├── index.html         # メインページ
│   ├── style.css          # スタイルシート
│   └── script.js          # フロントエンドJS
├── vercel.json            # Vercel設定
├── tsconfig.json          # TypeScript設定
└── package.json           # 依存関係
```

## 🚀 デプロイメント情報

### 環境
- **本番**: https://openbd.vercel.app/
- **プラットフォーム**: Vercel
- **ランタイム**: Node.js 18+
- **ビルド**: TypeScript → JavaScript

### 環境変数
```bash
# 現在設定済み
GITHUB_TOKEN="ghp_***"  # GitHub API用（未使用）

# 将来の拡張用
VERCEL_BLOB_STORE_ID    # Blobストレージ用
EDGE_CONFIG_ID          # Edge Config用
```

### デプロイコマンド
```bash
# TypeScript型チェック
npm run type-check

# 本番デプロイ
vercel --prod

# 環境変数取得
vercel env pull .env.local
```

## 📡 API仕様

### 1. フィード作成API
**Endpoint**: `POST /api/create-feed`

**リクエスト**:
```json
{
  "feedName": "技術書フィード",
  "seriesName": "技術評論社",
  "titleKeyword": "JavaScript", 
  "publisher": "株式会社技術評論社",
  "ccode": "3055",
  "ccodeMatchType": "prefix" // "exact" | "prefix" | "suffix"
}
```

**レスポンス**:
```json
{
  "success": true,
  "feedId": "abc123def456",
  "feedUrl": "https://openbd.vercel.app/api/feeds/abc123def456",
  "message": "フィードが正常に作成されました"
}
```

### 2. RSS配信API
**Endpoint**: `GET /api/feeds/{feedId}`

**レスポンス**: RSS 2.0形式のXML

### 3. フィード一覧API
**Endpoint**: `GET /api/feeds/index`

**レスポンス**:
```json
{
  "feeds": [],
  "totalFeeds": 0,
  "lastUpdated": "2025-06-21T14:32:23.000Z",
  "stats": {
    "totalActiveFeeds": 0,
    "totalFeeds": 0,
    "newestFeed": null,
    "oldestFeed": null
  }
}
```

## 🔧 現在の実装状況

### ✅ 完了済み機能
- **フロントエンド**: レスポンシブWebUI
- **フィード作成**: 条件指定によるフィード作成
- **RSS配信**: デモコンテンツによる配信
- **API設計**: 完全なREST API
- **TypeScript**: 型安全な実装
- **Vercelデプロイ**: 本番環境稼働

### 🚧 実装中・未実装機能
- **OpenBD API統合**: 実際の書籍データ取得
- **永続ストレージ**: Edge Config + Vercel Blob
- **定期更新**: Vercel Cron（毎日午前4時）
- **書籍マッチング**: 条件による書籍フィルタリング
- **RSS生成**: 実際の書籍データベースのRSS

### 🔄 ストレージ移行計画
```bash
# 現在: SimpleStorageManager (メモリ内)
# ↓
# 次期: EdgeStorageManager (Edge Config + Blob)
# ↓  
# 将来: KVStorageManager (Vercel KV) ※利用可能時
```

## 🛠️ 開発・保守情報

### ローカル開発
```bash
# 依存関係インストール
npm install

# 型チェック
npm run type-check

# ローカル開発サーバー
npm run dev  # vercel dev

# ビルド
npm run build  # tsc
```

### トラブルシューティング

#### 1. 500エラーが発生する場合
- **原因**: 環境変数の未設定、ストレージ接続エラー
- **解決**: `lib/storage-simple.ts`の使用確認、ログ確認

#### 2. TypeScriptエラー
```bash
# 型チェック実行
npm run type-check

# よくあるエラー: import/export文のパス
# 解決: `.js`拡張子を含めたパス指定
```

#### 3. Vercelデプロイエラー
```bash
# プロジェクト再リンク
vercel link

# 環境変数再取得
vercel env pull .env.local
```

### パフォーマンス最適化
- **Cold Start**: Serverless Functions初回起動時間
- **Bundle Size**: 依存関係の最小化
- **CDN Cache**: 静的ファイルのキャッシュ
- **Edge Functions**: 地理的分散（将来実装）

## 📚 外部API・サービス

### OpenBD API
- **URL**: https://api.openbd.jp/v1
- **用途**: 日本の書籍メタデータ取得
- **制限**: 1回あたり最大1000件
- **ドキュメント**: https://openbd.jp/spec/

### Vercel Services
- **Serverless Functions**: APIエンドポイント
- **Static Hosting**: フロントエンド配信
- **Vercel KV**: Redis互換ストレージ（未使用）
- **Vercel Blob**: ファイルストレージ（未使用）
- **Edge Config**: 高速設定配信（未使用）

## 🔐 セキュリティ

### 実装済み対策
- **CORS設定**: API Cross-Origin対応
- **入力値検証**: フォーム・API入力のバリデーション
- **XSS対策**: HTMLエスケープ処理
- **型安全性**: TypeScriptによる型チェック

### 注意事項
- **API制限**: OpenBD APIの利用制限遵守
- **データ保護**: ユーザー入力データの適切な処理
- **認証**: 現在未実装（将来の拡張検討）

## 🚀 今後の開発計画

### Phase 1: 基本機能完成
- [ ] OpenBD API実装
- [ ] 実際の書籍マッチング
- [ ] RSS生成の実装

### Phase 2: ストレージ統合
- [ ] Vercel KVまたはEdge Config + Blob
- [ ] 永続データ保存
- [ ] 定期更新機能

### Phase 3: 機能拡張
- [ ] ユーザー認証
- [ ] フィード管理機能
- [ ] 統計・分析機能
- [ ] パフォーマンス最適化

## 📞 サポート・問い合わせ

### 開発者向け
- **GitHub Issues**: https://github.com/analekt/openbd-feed/issues
- **リポジトリ**: https://github.com/analekt/openbd-feed

### Claude Code活用
- このプロジェクトはClaude Code (Sonnet 4)で開発されました
- 継続的な開発・保守時はこのCLAUDE.mdを参照してください
- 主要な設計決定と実装詳細が記録されています

---

**最終更新**: 2025年6月21日  
**バージョン**: v3.0  
**ステータス**: 本番稼働中（デモ機能）