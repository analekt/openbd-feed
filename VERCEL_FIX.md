# Vercel デプロイエラー修正手順

## エラーの原因
```
Error: No Output Directory named "public" found after the Build completed.
```

Vercelが静的ファイルを `public` ディレクトリで探しているが、実際は `docs` ディレクトリにある。

## 修正方法

### 方法1: Vercel Dashboard設定変更（推奨）

1. **Vercel Dashboard** → プロジェクト選択
2. **Settings** → **General**
3. **Build & Development Settings** を以下に変更：

```
Framework Preset: Other
Build Command: echo 'No build required'
Output Directory: docs
Install Command: npm install
Development Command: vercel dev
```

4. **Save** をクリック

### 方法2: プロジェクト再作成

1. 現在のプロジェクトを削除
2. 新しいプロジェクトを作成
3. 初期設定で上記の設定を行う

### 方法3: ファイル構造変更

```bash
# docsディレクトリの内容をpublicに移動
mkdir public
cp -r docs/* public/
```

## 再デプロイ手順

1. `vercel.json` の更新をコミット・プッシュ
2. Vercelで自動再デプロイが開始
3. または手動で **Redeploy** をクリック

## 確認事項

デプロイ成功後：
- [ ] サイトが正常に表示される
- [ ] `/api/create-feed` エンドポイントが動作する
- [ ] フィード作成フォームが機能する

## 追加の最適化

### パフォーマンス向上
```json
// vercel.json に追加
{
  "trailingSlash": false,
  "cleanUrls": true
}
```

### セキュリティヘッダー
```json
// vercel.json に追加
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        }
      ]
    }
  ]
}
```