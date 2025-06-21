# フィード作成用メールアドレス設定ガイド

## 1. Gmail新規作成（推奨）

### Step 1: Gmailアカウント作成
1. https://accounts.google.com/signup にアクセス
2. 以下のようなアドレスを作成：
   - `openbd-feed-requests@gmail.com`
   - `opendb-rss-service@gmail.com`
   - `book-feed-creator@gmail.com`

### Step 2: 自動分類設定
1. Gmail設定 → フィルタとブロック中のアドレス
2. 新しいフィルタを作成：
   - **件名**: `新刊フィード作成リクエスト`
   - **ラベル**: `フィード作成依頼`
   - **重要マーク**: ON

### Step 3: HTMLファイル更新
`docs/index.html` の295行目を更新：
```javascript
const mailtoUrl = `mailto:openbd-feed-requests@gmail.com?subject=${subject}&body=${body}`;
```

### Step 4: 通知設定
1. Gmail設定 → 全般
2. デスクトップ通知: ON
3. モバイル通知: 即座に

## 2. 既存メールのエイリアス使用

### Step 1: Plus記法を使用
既存のGmailに `+openbd` を追加：
```
your-email+openbd@gmail.com
```

### Step 2: フィルタ設定
1. Gmail設定 → フィルタ
2. 条件：`宛先: your-email+openbd@gmail.com`
3. アクション：ラベル `OpenBDフィード` を追加

### Step 3: HTMLファイル更新
```javascript
const mailtoUrl = `mailto:your-email+openbd@gmail.com?subject=${subject}&body=${body}`;
```

## 3. メール処理のワークフロー

### 手動処理の場合
1. **メール受信通知**
2. **内容確認**（フィード名、検索条件）
3. **GitHub Issue作成**：
   - https://github.com/analekt/opendb-feed/issues/new
   - ラベル `feed-request` を追加
4. **GitHub Actions自動実行**
5. **完了**

### 半自動処理（推奨）
1. **Gmail → Zapier連携**
2. **自動Issue作成**
3. **メール通知で確認**

## 4. セキュリティ考慮事項

### スパム対策
- Gmail のスパムフィルタが自動で処理
- 必要に応じて手動でスパム報告

### プライバシー
- フィード作成リクエストのみ受信
- 個人情報は含まれない
- メールアドレスは公開されない

## 5. 推奨設定

### 最もシンプル
```
メールアドレス: your-personal-email+openbd@gmail.com
処理方法: 手動でGitHub Issue作成
```

### 最も効率的
```
メールアドレス: 専用Gmail新規作成
処理方法: Zapier自動化
通知: モバイルアプリ
```

## 6. HTMLファイル修正例

現在のコード：
```javascript
const mailtoUrl = `mailto:opendb-feed@example.com?subject=${subject}&body=${body}`;
```

修正後：
```javascript
const mailtoUrl = `mailto:openbd-feed-requests@gmail.com?subject=${subject}&body=${body}`;
```

手動処理でも問題ありませんが、1日数件のリクエストが来ると予想されます。