# GitHubアカウント不要フィード作成の完全セットアップガイド

## 1. Formspreeセットアップ（推奨）

### Step 1: Formspreeアカウント作成
1. https://formspree.io/ にアクセス
2. 無料アカウントを作成
3. 新しいフォームを作成

### Step 2: フォーム設定
1. Form設定で以下を有効化：
   - **AJAX submissions**: ON
   - **CORS**: ON
2. フォームIDをコピー（例：xeqpgrlw）

### Step 3: HTMLファイル修正
`docs/index.html` の224行目を修正：
```javascript
const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
```
↓
```javascript
const response = await fetch('https://formspree.io/f/xeqpgrlw', {
```

### Step 4: Webhook設定（自動フィード作成用）
1. Formspree設定 → Integrations
2. Webhook URLを追加：`https://api.github.com/repos/analekt/opendb-feed/dispatches`
3. または Zapier/Make.com で自動化

## 2. メール設定

### Step 1: 専用メールアドレス準備
- 新しいメールアドレスを作成（例：openbd-feed@gmail.com）
- または既存メールのエイリアスを使用

### Step 2: HTMLファイル修正
`docs/index.html` の295行目を修正：
```javascript
const mailtoUrl = `mailto:opendb-feed@example.com?subject=${subject}&body=${body}`;
```
↓
```javascript
const mailtoUrl = `mailto:your-email@gmail.com?subject=${subject}&body=${body}`;
```

## 3. 自動処理の設定

### Option A: Zapier使用（推奨）
1. Zapier.com でアカウント作成
2. Trigger: Formspree New Submission
3. Action: GitHub Create Issue
4. GitHub Personal Access Token を設定

### Option B: Make.com使用
1. Make.com でアカウント作成
2. Formspree → GitHub Issue の連携を設定

### Option C: 手動処理
1. メール受信時に手動でGitHub Issueを作成
2. 既存のGitHub Actionsが自動でフィード生成

## 4. 動作フロー

```
ユーザー入力 → Formspree → メール通知 → 手動/自動Issue作成 → GitHub Actions → RSS生成
```

## 5. 無料枠の制限

- **Formspree Free**: 50送信/月
- **Zapier Free**: 100タスク/月
- **GitHub Actions**: 2000分/月

## 6. 完全手動版（最もシンプル）

もし自動化が不要であれば：
1. Formspreeの代わりに単純なメール送信のみ
2. メール受信を確認して手動でIssue作成
3. GitHub Actionsで自動RSS生成

この方法であれば追加の設定は不要です。