import { VercelRequest, VercelResponse } from '@vercel/node';
import { StorageManager } from '../../lib/storage.js';

const storage = new StorageManager();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET メソッドのみ受け付け
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { id } = req.query;
    
    // フィードIDの検証
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid feed ID' });
      return;
    }

    // フィード情報を取得
    const feed = await storage.getFeed(id);
    if (!feed) {
      res.status(404).json({ error: 'Feed not found' });
      return;
    }

    // フィードが無効化されている場合
    if (!feed.active) {
      res.status(410).json({ error: 'Feed is inactive' });
      return;
    }

    // RSS コンテンツを取得
    const rssContent = await storage.getRSSContent(id);
    if (!rssContent) {
      // RSS が存在しない場合は空のフィードを返す
      const emptyRSS = generateEmptyRSS(feed);
      res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1時間キャッシュ
      res.status(200).send(emptyRSS);
      return;
    }

    // RSS ヘッダーを設定
    res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1時間キャッシュ
    res.setHeader('Last-Modified', new Date(feed.lastUpdated).toUTCString());
    
    // ETag を生成（フィードの最終更新時刻をベースに）
    const etag = `"${Buffer.from(feed.lastUpdated).toString('base64')}"`;
    res.setHeader('ETag', etag);
    
    // If-None-Match ヘッダーをチェック（キャッシュ対応）
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === etag) {
      res.status(304).end();
      return;
    }

    // RSS コンテンツを返す
    res.status(200).send(rssContent);

  } catch (error) {
    console.error(`フィード配信エラー (ID: ${req.query.id}):`, error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'フィードの取得中にエラーが発生しました'
    });
  }
}

function generateEmptyRSS(feed: any): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.name)}</title>
    <link>https://openbd.jp/</link>
    <description>${escapeXml(`OpenBD APIから取得した新刊情報のフィードです: ${feed.name}`)}</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://opendb-feed.vercel.app/api/feeds/${feed.id}" rel="self" type="application/rss+xml"/>
    <generator>OpenBD Feed Generator v3.0</generator>
    
    <!-- まだ条件に一致する書籍がありません -->
  </channel>
</rss>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}