# OpenBD新刊フィード作成サービス

OpenBD APIを使用して、ユーザーが指定した条件に一致する新刊情報をRSSフィードで配信するマルチユーザー対応サービスです。

## 機能

- **マルチユーザー対応**: 複数のユーザーがそれぞれ独自の条件でフィードを作成可能
- **Web UI**: ブラウザから簡単にフィード作成リクエストを送信
- **自動処理**: GitHub Issueベースで自動的にフィード作成・管理
- **定期更新**: 毎日午前4時に全フィードを自動更新
- **GitHub Pages**: 静的サイトとして高速配信

## 利用方法

1. **サービスサイトにアクセス**
   - https://analekt.github.io/opendb-feed/

2. **フィード作成フォームに入力**
   - フィード名（必須）
   - 検索条件（少なくとも一つは必須）

3. **検索条件**
   - **シリーズ名/レーベル名**: 完全一致
   - **書名**: キーワード含有（部分一致）
   - **発行元出版社**: 完全一致
   - **Cコード**: 前方一致

4. **フィード取得**
   - 作成されたフィードのURLをRSSリーダーに登録

## 制限事項

- **全体制限**: 最大1000フィード
- **文字数制限**:
  - フィード名: 100文字以内
  - 各検索条件: 200文字以内（Cコードは10文字以内）

## システム構成

### フロントエンド
- 静的HTML/CSS/JavaScript
- GitHub Pages でホスティング
- レスポンシブデザイン

### バックエンド
- Node.js + GitHub Actions
- GitHub Issues を管理システムとして活用
- JSON ファイルでデータ管理

### データフロー
1. ユーザーがWebフォームから送信
2. GitHub Issue として自動作成
3. GitHub Actions がIssueを検知・処理
4. フィード設定を作成・RSSファイル生成
5. 毎日の定期実行で全フィード更新

## 開発者向け情報

### セットアップ

```bash
# 依存関係のインストール
npm install

# 手動でフィード生成実行
npm run build
```

### 主要ファイル

```
src/
  ├── openbd-client.js      # OpenBD API クライアント
  ├── book-matcher.js       # 書籍検索条件マッチング
  ├── rss-generator.js      # RSS フィード生成
  ├── feed-updater.js       # フィード更新処理（マルチフィード対応）
  ├── feed-manager.js       # フィード設定管理・バリデーション
  └── issue-processor.js    # GitHub Issue 処理

docs/
  ├── index.html           # フィード作成UI
  └── feeds/
      ├── index.json       # フィード一覧
      └── [feedId].xml     # 各ユーザーのRSSフィード

data/
  ├── feeds/               # 各フィードの設定と履歴
  └── global-history.json  # グローバル処理履歴
```

### GitHub Actions

- **Issue処理**: 新しいフィード作成リクエストを自動処理
- **定期更新**: 毎日全フィードの内容を更新
- **自動デプロイ**: GitHub Pages への自動デプロイ

## API情報

- **OpenBD API**: https://openbd.jp/
- **取得データ**: 最新1000件の書籍情報から検索
- **更新頻度**: 毎日1回（午前4時JST）

## ライセンス

MIT License