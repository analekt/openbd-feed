import { Feed, FeedHistory, GlobalConfig } from '../types/feed.js';

// 一時的なメモリ内ストレージ（本格運用時はVercel KVまたはEdge Config + Blobに移行）
export class SimpleStorageManager {
  private static feeds: Map<string, Feed> = new Map();
  private static history: Map<string, FeedHistory> = new Map();
  private static globalConfig: GlobalConfig = {
    feedCounter: 0,
    lastGlobalUpdate: new Date().toISOString(),
    openbd: {
      lastFetch: new Date().toISOString(),
      maxBooksPerRequest: 1000
    }
  };
  private static rssContent: Map<string, string> = new Map();

  // フィード管理
  async saveFeed(feed: Feed): Promise<void> {
    try {
      SimpleStorageManager.feeds.set(feed.id, feed);
      console.log(`フィード保存完了: ${feed.id}`);
    } catch (error) {
      console.error('フィード保存エラー:', error);
      throw error;
    }
  }

  async getFeed(feedId: string): Promise<Feed | null> {
    try {
      return SimpleStorageManager.feeds.get(feedId) || null;
    } catch (error) {
      console.error(`フィード取得エラー (${feedId}):`, error);
      return null;
    }
  }

  async getAllFeeds(): Promise<Feed[]> {
    try {
      const feeds = Array.from(SimpleStorageManager.feeds.values());
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
      SimpleStorageManager.feeds.delete(feedId);
      SimpleStorageManager.history.delete(feedId);
      SimpleStorageManager.rssContent.delete(feedId);
    } catch (error) {
      console.error(`フィード削除エラー (${feedId}):`, error);
      throw error;
    }
  }

  // フィード履歴管理
  async saveFeedHistory(feedId: string, history: FeedHistory): Promise<void> {
    try {
      SimpleStorageManager.history.set(feedId, history);
    } catch (error) {
      console.error(`履歴保存エラー (${feedId}):`, error);
      throw error;
    }
  }

  async getFeedHistory(feedId: string): Promise<FeedHistory | null> {
    try {
      return SimpleStorageManager.history.get(feedId) || null;
    } catch (error) {
      console.error(`履歴取得エラー (${feedId}):`, error);
      return null;
    }
  }

  // グローバル設定管理
  async getGlobalConfig(): Promise<GlobalConfig> {
    try {
      return { ...SimpleStorageManager.globalConfig };
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
      SimpleStorageManager.globalConfig = { ...config };
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
      SimpleStorageManager.rssContent.set(feedId, content);
    } catch (error) {
      console.error(`RSS保存エラー (${feedId}):`, error);
      throw error;
    }
  }

  async getRSSContent(feedId: string): Promise<string | null> {
    try {
      return SimpleStorageManager.rssContent.get(feedId) || null;
    } catch (error) {
      console.error(`RSS取得エラー (${feedId}):`, error);
      return null;
    }
  }

  // フィード一覧インデックス管理
  async updateFeedIndex(): Promise<void> {
    try {
      // メモリ内ストレージなので特に処理なし
      console.log('フィードインデックス更新（メモリ内）');
    } catch (error) {
      console.error('フィードインデックス更新エラー:', error);
      throw error;
    }
  }
}