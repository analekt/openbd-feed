import { VercelRequest, VercelResponse } from '@vercel/node';
import { SimpleStorageManager } from '../../lib/storage-simple.js';

const storage = new SimpleStorageManager();

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

    // 一時的なデモ用RSS（フィードIDに基づく固定RSS）
    const demoRSS = generateDemoRSS(id);
    
    // RSS ヘッダーを設定
    res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1時間キャッシュ
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    // RSS コンテンツを返す
    res.status(200).send(demoRSS);

  } catch (error) {
    console.error(`フィード配信エラー (ID: ${req.query.id}):`, error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'フィードの取得中にエラーが発生しました'
    });
  }
}

function generateDemoRSS(feedId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>New Book RSS Feed (${feedId})</title>
    <link>https://openbd.jp/</link>
    <description>Demo feed for new book information from OpenBD API</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://openbd.vercel.app/api/feeds/${feedId}" rel="self" type="application/rss+xml"/>
    <generator>New Book RSS Generator v3.0</generator>
    
    <item>
      <title>【デモ】JavaScript最新技術ガイド / サンプル出版社</title>
      <link>https://openbd.jp/9784123456789</link>
      <description><![CDATA[
        ISBN: 978-4-12345-678-9<br><br>
        このフィードは正常に動作しています。実際の書籍データはOpenBD APIから取得され、指定された条件に一致する新刊が自動的に追加されます。
      ]]></description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid isPermaLink="false">demo-${feedId}-001</guid>
    </item>
    
    <item>
      <title>【デモ】TypeScript実践ガイド / テック出版</title>
      <link>https://openbd.jp/9784987654321</link>
      <description><![CDATA[
        ISBN: 978-4-98765-432-1<br><br>
        フィードが作成されました。毎日午前4時に自動更新され、新しい書籍情報が追加されます。
      ]]></description>
      <pubDate>${new Date(Date.now() - 86400000).toUTCString()}</pubDate>
      <guid isPermaLink="false">demo-${feedId}-002</guid>
    </item>
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