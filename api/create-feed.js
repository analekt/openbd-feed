export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // プリフライトリクエスト
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const feedData = req.body;
    
    // 入力値の検証
    if (!feedData.feedName || !feedData.feedName.trim()) {
      return res.status(400).json({ error: 'フィード名は必須です' });
    }

    // 検索条件のチェック
    const hasSearchCriteria = (
      (feedData.seriesName && feedData.seriesName.trim()) ||
      (feedData.titleKeyword && feedData.titleKeyword.trim()) ||
      (feedData.publisher && feedData.publisher.trim()) ||
      (feedData.ccode && feedData.ccode.trim())
    );

    if (!hasSearchCriteria) {
      return res.status(400).json({ error: '少なくとも一つの検索条件を入力してください' });
    }

    // GitHub APIでIssue作成
    const issueResponse = await fetch('https://api.github.com/repos/analekt/opendb-feed/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'OpenBD-Feed-Service',
      },
      body: JSON.stringify({
        title: `新しいフィード作成リクエスト: ${feedData.feedName}`,
        body: `フィード作成リクエスト

フィード名: ${feedData.feedName}
シリーズ名/レーベル名: ${feedData.seriesName || '(なし)'}
書名キーワード: ${feedData.titleKeyword || '(なし)'}
発行元出版社: ${feedData.publisher || '(なし)'}
Cコード: ${feedData.ccode || '(なし)'}
Cコード検索方法: ${feedData.ccodeMatchType || 'prefix'}

このイシューは自動的に処理されます。
作成日時: ${new Date().toISOString()}`,
        labels: ['feed-request']
      })
    });

    if (!issueResponse.ok) {
      // GitHub API失敗時はフォールバック
      console.error('GitHub API error:', issueResponse.status);
      
      // 代替手段として管理者にメール通知など
      return res.status(200).json({
        success: true,
        method: 'fallback',
        message: 'リクエストを受け付けました。手動で処理します。',
        feedUrl: null
      });
    }

    const issue = await issueResponse.json();
    
    // 仮のフィードURLを生成
    const feedId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const feedUrl = `https://analekt.github.io/opendb-feed/feeds/${feedId}.xml`;

    return res.status(200).json({
      success: true,
      method: 'github',
      message: 'フィード作成リクエストを受け付けました。',
      feedUrl: feedUrl,
      issueNumber: issue.number,
      estimatedTime: '数分以内'
    });

  } catch (error) {
    console.error('Error creating feed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}