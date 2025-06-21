# Vercel移行セットアップガイド

## 1. Vercelアカウント作成・設定

### Step 1: Vercelアカウント作成
1. https://vercel.com/ にアクセス
2. 「Start Deploying」をクリック
3. GitHubアカウントでサインアップ

### Step 2: プロジェクト作成
1. Vercel Dashboard → 「New Project」
2. GitHubリポジトリ `analekt/opendb-feed` をインポート
3. プロジェクト名：`opendb-feed` または任意

### Step 3: 環境変数設定
1. Project Settings → Environment Variables
2. 以下を追加：
   ```
   Name: GITHUB_TOKEN
   Value: ghp_xxxxxxxxxxxxxxxxxxxx
   Environment: Production, Preview, Development
   ```

### Step 4: デプロイ設定確認
1. Build & Development Settings:
   - Framework Preset: **Other**
   - Build Command: （空欄でOK）
   - Output Directory: `docs`
   - Install Command: `npm install`

## 2. GitHub Personal Access Token作成

### Step 1: GitHub設定
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. 「Generate new token (classic)」

### Step 2: トークン設定
1. **Note**: `Vercel OpenBD Feed Service`
2. **Expiration**: 90 days（定期更新推奨）
3. **Scopes**:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `public_repo` (Access public repositories)
   - ✅ `write:discussion` (Write team discussions)

### Step 3: トークンコピー
1. 「Generate token」をクリック
2. 表示されたトークンをコピー（二度と表示されません）
3. Vercelの環境変数に設定

## 3. デプロイ実行

### Step 1: 初回デプロイ
1. Vercel Dashboard でプロジェクトを確認
2. 自動的にデプロイが開始
3. ビルドログを確認

### Step 2: カスタムドメイン設定（オプション）
1. Project Settings → Domains
2. カスタムドメインを追加
3. DNS設定を行う

## 4. 動作確認

### Step 1: サイトアクセス
1. デプロイ完了後のURLにアクセス
2. フォームが正常に表示されることを確認

### Step 2: API動作確認
1. フィード作成フォームにテストデータを入力
2. 送信ボタンをクリック
3. 成功メッセージが表示されるか確認

### Step 3: GitHub Issue確認
1. https://github.com/analekt/opendb-feed/issues
2. 新しいIssueが自動作成されているか確認
3. GitHub Actionsが実行されているか確認

## 5. DNSとドメイン設定

### カスタムドメイン使用の場合
```
ドメイン例: bookfeed.example.com
DNS設定: CNAME → cname.vercel-dns.com
```

### Vercel標準ドメイン
```
https://opendb-feed-xxx.vercel.app
（xxxxxは自動生成される文字列）
```

## 6. 移行手順

### Step 1: GitHub Pages無効化
1. Repository Settings → Pages
2. Source を「None」に変更

### Step 2: README更新
1. サービスURLをVercelのURLに変更
2. 新しいアーキテクチャについて記載

### Step 3: リダイレクト設定（オプション）
GitHub Pagesから Vercel への301リダイレクト設定

## 7. モニタリング・運用

### Vercel Analytics
1. Project Settings → Analytics
2. 使用状況とパフォーマンスを監視

### GitHub Actions監視
1. Actions タブで定期実行を監視
2. 失敗時のアラート設定

### ログ確認
1. Vercel Functions → Logs
2. エラー発生時の詳細確認

## 8. コスト管理

### 無料枠の制限
- **Function実行**: 100GB-Hours/月
- **帯域幅**: 100GB/月
- **ビルド時間**: 6000分/月

### 使用量監視
1. Dashboard → Usage
2. 制限に近づいた場合のアラート設定

## 9. セキュリティ

### 環境変数管理
- GitHub Tokenの定期更新（90日ごと）
- 不要な権限は与えない

### API制限
- Rate limiting は Vercel が自動処理
- 必要に応じて追加の制限を実装

## 10. バックアップ・災害対策

### GitHub Token バックアップ
- 複数のトークンを作成して冗長化
- 期限切れアラートの設定

### Vercel障害時の対策
- GitHub Pages への切り戻し手順を準備
- 重要なデータはGitHubリポジトリに保管

---

## 移行完了チェックリスト

- [ ] Vercelアカウント作成
- [ ] GitHub Token作成・設定
- [ ] プロジェクトデプロイ
- [ ] 環境変数設定
- [ ] API動作確認
- [ ] フィード作成テスト
- [ ] GitHub Actions確認
- [ ] ドメイン設定（オプション）
- [ ] 監視設定
- [ ] README更新

この手順でVercelへの移行が完了します。