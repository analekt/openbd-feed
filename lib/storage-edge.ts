import { get } from '@vercel/edge-config';
import { put, del, list } from '@vercel/blob';
import { Feed, FeedHistory, GlobalConfig } from '../types/feed.js';

export class EdgeStorageManager {
  // Edge Config: フィード設定・メタデータ
  // Blob: RSSコンテンツ・履歴データ

  // フィード管理
  async saveFeed(feed: Feed): Promise<void> {
    try {
      // Edge Configでフィード設定を保存（実際にはAPIで更新）
      // 現在は Blob にJSONとして保存
      const blob = await put(`feeds/${feed.id}.json`, JSON.stringify(feed), {
        access: 'public'
      });
      console.log(`フィード保存完了: ${feed.id}`);
    } catch (error) {
      console.error('フィード保存エラー:', error);
      throw error;
    }
  }

  async getFeed(feedId: string): Promise<Feed | null> {
    try {
      // まずEdge Configから取得を試行
      const edgeData = await get(`feed-${feedId}`).catch(() => null);
      if (edgeData) {
        return edgeData as unknown as Feed;
      }

      // Edge Configで見つからない場合はBlobから取得
      const response = await fetch(`https://${process.env.VERCEL_BLOB_STORE_ID}.blob.vercel-storage.com/feeds/${feedId}.json`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error(`フィード取得エラー (${feedId}):`, error);
      return null;
    }
  }

  async getAllFeeds(): Promise<Feed[]> {
    try {
      // Blobから全フィードを取得
      const blobs = await list({ prefix: 'feeds/' });
      const feeds: Feed[] = [];

      for (const blob of blobs.blobs) {
        if (blob.pathname.endsWith('.json')) {
          try {
            const response = await fetch(blob.url);
            if (response.ok) {
              const feed = await response.json();
              feeds.push(feed);
            }
          } catch (error) {
            console.error(`フィード読み込みエラー: ${blob.pathname}`, error);
          }
        }
      }

      return feeds.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('全フィード取得エラー:', error);
      return [];
    }
  }

  async getActiveFeeds(): Promise<Feed[]> {
    const allFeeds = await this.getAllFeeds();
    return allFeeds.filter(feed => feed.active);
  }

  async deleteFeed(feedId: string): Promise<void> {
    try {
      await del(`feeds/${feedId}.json`);
      await del(`history/${feedId}.json`);
      await del(`rss/${feedId}.xml`);
    } catch (error) {
      console.error(`フィード削除エラー (${feedId}):`, error);
      throw error;
    }
  }

  // フィード履歴管理
  async saveFeedHistory(feedId: string, history: FeedHistory): Promise<void> {
    try {
      await put(`history/${feedId}.json`, JSON.stringify(history), {
        access: 'public'
      });
    } catch (error) {
      console.error(`履歴保存エラー (${feedId}):`, error);
      throw error;
    }
  }

  async getFeedHistory(feedId: string): Promise<FeedHistory | null> {
    try {
      const response = await fetch(`https://${process.env.VERCEL_BLOB_STORE_ID}.blob.vercel-storage.com/history/${feedId}.json`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error(`履歴取得エラー (${feedId}):`, error);
      return null;
    }
  }

  // グローバル設定管理
  async getGlobalConfig(): Promise<GlobalConfig> {
    try {
      // Edge Configから取得を試行
      const edgeConfig = await get('global-config').catch(() => null);
      if (edgeConfig) {
        return edgeConfig as unknown as GlobalConfig;
      }

      // Edge Configで見つからない場合はBlobから取得
      const response = await fetch(`https://${process.env.VERCEL_BLOB_STORE_ID}.blob.vercel-storage.com/config/global.json`);
      if (response.ok) {
        return await response.json();
      }

      // デフォルト設定を返す
      return {
        feedCounter: 0,
        lastGlobalUpdate: new Date().toISOString(),
        openbd: {
          lastFetch: new Date().toISOString(),
          maxBooksPerRequest: 1000
        }
      };
    } catch (error) {
      console.error('グローバル設定取得エラー:', error);
      return {
        feedCounter: 0,
        lastGlobalUpdate: new Date().toISOString(),
        openbd: {
          lastFetch: new Date().toISOString(),
          maxBooksPerRequest: 1000
        }
      };
    }
  }

  async saveGlobalConfig(config: GlobalConfig): Promise<void> {
    try {
      await put('config/global.json', JSON.stringify(config), {
        access: 'public'
      });
    } catch (error) {
      console.error('グローバル設定保存エラー:', error);
      throw error;
    }
  }

  async incrementFeedCounter(): Promise<number> {
    const config = await this.getGlobalConfig();
    config.feedCounter += 1;
    await this.saveGlobalConfig(config);
    return config.feedCounter;
  }

  // フィードID生成
  generateFeedId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // RSS ファイル管理
  async saveRSSContent(feedId: string, content: string): Promise<void> {
    try {
      await put(`rss/${feedId}.xml`, content, {
        access: 'public',
        contentType: 'application/rss+xml'
      });
    } catch (error) {
      console.error(`RSS保存エラー (${feedId}):`, error);
      throw error;
    }
  }

  async getRSSContent(feedId: string): Promise<string | null> {
    try {
      const response = await fetch(`https://${process.env.VERCEL_BLOB_STORE_ID}.blob.vercel-storage.com/rss/${feedId}.xml`);
      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch (error) {
      console.error(`RSS取得エラー (${feedId}):`, error);
      return null;
    }
  }

  // フィード一覧インデックス管理
  async updateFeedIndex(): Promise<void> {
    try {
      const feeds = await this.getAllFeeds();
      const feedIndex = feeds.map(feed => ({
        id: feed.id,
        name: feed.name,
        criteria: feed.criteria,
        createdAt: feed.createdAt,
        lastUpdated: feed.lastUpdated,
        itemCount: 0 // TODO: RSS アイテム数を取得
      }));

      await put('index/feeds.json', JSON.stringify({
        feeds: feedIndex,
        totalFeeds: feedIndex.length,
        lastUpdated: new Date().toISOString()
      }), {
        access: 'public'
      });
    } catch (error) {
      console.error('フィードインデックス更新エラー:', error);
      throw error;
    }
  }
}