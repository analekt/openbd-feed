import { VercelRequest, VercelResponse } from '@vercel/node';
import { CreateFeedRequest, CreateFeedResponse, Feed } from '../types/index.js';
import { StorageManager } from '../lib/storage.js';
import { BookMatcher } from '../lib/book-matcher.js';
import { FeedUpdater } from '../lib/feed-updater.js';

const storage = new StorageManager();
const bookMatcher = new BookMatcher();
const feedUpdater = new FeedUpdater();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS ヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS リクエスト（プリフライト）への対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST メソッドのみ受け付け
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const requestData: CreateFeedRequest = req.body;

    // 入力値の検証
    const validation = validateCreateFeedRequest(requestData);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      } as CreateFeedResponse);
      return;
    }

    // 検索条件の検証
    const criteriaValidation = bookMatcher.validateCriteria(requestData);
    if (!criteriaValidation.valid) {
      res.status(400).json({
        success: false,
        message: criteriaValidation.errors.join(', ')
      } as CreateFeedResponse);
      return;
    }

    // フィード数制限チェック
    const existingFeeds = await storage.getAllFeeds();
    if (existingFeeds.length >= 1000) {
      res.status(429).json({
        success: false,
        message: 'フィード数の上限（1000件）に達しています'
      } as CreateFeedResponse);
      return;
    }

    // 新しいフィードを作成
    const feedId = storage.generateFeedId();
    const now = new Date().toISOString();

    const newFeed: Feed = {
      id: feedId,
      name: requestData.feedName.trim(),
      criteria: {
        seriesName: requestData.seriesName?.trim() || undefined,
        titleKeyword: requestData.titleKeyword?.trim() || undefined,
        publisher: requestData.publisher?.trim() || undefined,
        ccode: requestData.ccode?.trim() || undefined,
        ccodeMatchType: requestData.ccodeMatchType || 'prefix'
      },
      createdAt: now,
      lastUpdated: now,
      active: true,
      settings: {
        maxItems: 50,
        updateInterval: 'daily'
      }
    };

    // フィードを保存
    await storage.saveFeed(newFeed);

    // フィードカウンターを更新
    await storage.incrementFeedCounter();

    // 初回フィード生成
    await feedUpdater.createInitialFeed(newFeed);

    // フィードインデックスを更新
    await storage.updateFeedIndex();

    console.log(`新しいフィード作成: ${newFeed.name} (${feedId})`);

    // 成功レスポンス
    const feedUrl = `https://opendb-feed.vercel.app/api/feeds/${feedId}`;
    
    res.status(200).json({
      success: true,
      feedId,
      feedUrl,
      message: 'フィードが正常に作成されました'
    } as CreateFeedResponse);

  } catch (error) {
    console.error('フィード作成エラー:', error);
    
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました。しばらく時間をおいて再試行してください。'
    } as CreateFeedResponse);
  }
}

function validateCreateFeedRequest(req: CreateFeedRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // フィード名の検証
  if (!req.feedName || !req.feedName.trim()) {
    errors.push('フィード名は必須です');
  } else if (req.feedName.trim().length > 100) {
    errors.push('フィード名は100文字以内で入力してください');
  }

  // Cコードマッチングタイプの検証
  const validMatchTypes = ['exact', 'prefix', 'suffix'];
  if (req.ccodeMatchType && !validMatchTypes.includes(req.ccodeMatchType)) {
    errors.push('Cコードマッチングタイプが無効です');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}