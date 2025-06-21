import { VercelRequest, VercelResponse } from '@vercel/node';
import { SimpleStorageManager } from '../../lib/storage-simple.js';

const storage = new SimpleStorageManager();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS ヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS リクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET メソッドのみ受け付け
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // フィード一覧インデックスを取得
    const feedIndex = await storage.getGlobalConfig();
    const feedIndexData = await storage.getAllFeeds();

    // 公開用のフィード情報を作成
    const publicFeeds = feedIndexData
      .filter(feed => feed.active)
      .map(feed => ({
        id: feed.id,
        name: feed.name,
        criteria: {
          seriesName: feed.criteria.seriesName || null,
          titleKeyword: feed.criteria.titleKeyword || null,
          publisher: feed.criteria.publisher || null,
          ccode: feed.criteria.ccode || null,
          ccodeMatchType: feed.criteria.ccodeMatchType
        },
        createdAt: feed.createdAt,
        lastUpdated: feed.lastUpdated,
        feedUrl: `https://openbd.vercel.app/api/feeds/${feed.id}`,
        itemCount: 0 // TODO: RSS アイテム数を取得
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const response = {
      feeds: publicFeeds,
      totalFeeds: publicFeeds.length,
      lastUpdated: new Date().toISOString(),
      stats: {
        totalActiveFeeds: publicFeeds.length,
        totalFeeds: feedIndexData.length,
        newestFeed: publicFeeds.length > 0 ? publicFeeds[0].createdAt : null,
        oldestFeed: publicFeeds.length > 0 ? publicFeeds[publicFeeds.length - 1].createdAt : null
      }
    };

    // キャッシュヘッダーを設定
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30分キャッシュ
    res.setHeader('Content-Type', 'application/json');

    res.status(200).json(response);

  } catch (error) {
    console.error('フィード一覧取得エラー:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'フィード一覧の取得中にエラーが発生しました',
      feeds: [],
      totalFeeds: 0
    });
  }
}