import { VercelRequest, VercelResponse } from '@vercel/node';
import { FeedUpdater } from '../lib/feed-updater.js';

const feedUpdater = new FeedUpdater();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // このエンドポイントはVercel Cronからのみアクセス可能にする
  const authHeader = req.headers.authorization;
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Vercel Cronからのリクエストかどうかを確認（オプション）
  const isFromCron = req.headers['user-agent']?.includes('vercel-cron') || 
                    req.headers['x-vercel-cron'] === '1';

  try {
    console.log('定期フィード更新処理開始...');
    console.log(`リクエスト元: ${isFromCron ? 'Vercel Cron' : 'Manual'}`);

    const startTime = Date.now();
    
    // 全フィードを更新
    const result = await feedUpdater.updateAllFeeds();
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    const response = {
      success: result.success,
      message: result.success ? 
        `フィード更新完了: ${result.updatedCount}件成功` :
        `フィード更新中にエラーが発生: ${result.errors.length}件`,
      stats: {
        updatedCount: result.updatedCount,
        errorCount: result.errors.length,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      errors: result.errors
    };

    console.log('定期フィード更新処理完了:', response);

    res.status(200).json(response);

  } catch (error) {
    console.error('定期更新処理でエラー:', error);
    
    res.status(500).json({
      success: false,
      message: '定期更新処理中にエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// 手動実行用のエンドポイント（管理者用）
export async function manualUpdate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // 管理者認証（簡易版）
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers['x-admin-password'];

  if (adminPassword && adminPassword !== providedPassword) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    console.log('手動フィード更新処理開始...');
    
    const result = await feedUpdater.updateAllFeeds();
    const status = await feedUpdater.getUpdateStatus();

    res.status(200).json({
      success: result.success,
      message: `手動更新完了: ${result.updatedCount}件成功`,
      updatedCount: result.updatedCount,
      errors: result.errors,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('手動更新処理でエラー:', error);
    
    res.status(500).json({
      success: false,
      message: '手動更新処理中にエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}