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

    // フィード情報を取得
    const feedData = await storage.getFeed(id);
    
    // フィードが存在しない場合
    if (!feedData) {
      res.status(404).json({ error: 'Feed not found' });
      return;
    }

    // フィード情報に基づくRSS生成
    const rssContent = generateRSSWithFeedData(id, feedData);
    
    // RSS ヘッダーを設定
    res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1時間キャッシュ
    res.setHeader('Last-Modified', new Date().toUTCString());
    
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

function generateRSSWithFeedData(feedId: string, feedData: any): string {
  // フィード条件からタイトルを生成
  const feedTitle = generateFeedTitle(feedData.name, feedData.criteria);
  
  // フィード条件から説明文を生成
  const feedDescription = generateFeedDescription(feedData.criteria);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>https://openbd.jp/</link>
    <description>${escapeXml(feedDescription)}</description>
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

function generateFeedTitle(feedName: string, criteria: any): string {
  const conditions = [];
  
  if (criteria.seriesName) {
    conditions.push(`シリーズ「${criteria.seriesName}」`);
  }
  if (criteria.titleKeyword) {
    conditions.push(`「${criteria.titleKeyword}」関連`);
  }
  if (criteria.publisher) {
    conditions.push(`${criteria.publisher}発行`);
  }
  if (criteria.ccode) {
    const matchTypeText = {
      exact: '完全一致',
      prefix: '前方一致', 
      suffix: '後方一致'
    }[criteria.ccodeMatchType] || '前方一致';
    conditions.push(`Cコード${criteria.ccode}(${matchTypeText})`);
  }
  
  if (conditions.length > 0) {
    return `${feedName} - ${conditions.join('・')} - 新刊RSS`;
  } else {
    return `${feedName} - 新刊RSS`;
  }
}

function generateFeedDescription(criteria: any): string {
  const conditions = [];
  
  if (criteria.seriesName) {
    conditions.push(`シリーズ名「${criteria.seriesName}」(完全一致)`);
  }
  if (criteria.titleKeyword) {
    conditions.push(`書名に「${criteria.titleKeyword}」を含む`);
  }
  if (criteria.publisher) {
    conditions.push(`出版社「${criteria.publisher}」(完全一致)`);
  }
  if (criteria.ccode) {
    const matchTypeText = {
      exact: '完全一致',
      prefix: '前方一致',
      suffix: '後方一致'
    }[criteria.ccodeMatchType] || '前方一致';
    conditions.push(`Cコード「${criteria.ccode}」(${matchTypeText})`);
  }
  
  const baseDescription = 'OpenBD APIを使用した新刊書籍情報のRSSフィードです。';
  
  if (conditions.length > 0) {
    return `${baseDescription} 検索条件: ${conditions.join('、')}`;
  } else {
    return baseDescription;
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}