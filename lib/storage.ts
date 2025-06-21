import { kv } from '@vercel/kv';
import { Feed, FeedHistory, GlobalConfig } from '../types/feed.js';

export class StorageManager {
  // フィード管理
  async saveFeed(feed: Feed): Promise<void> {
    await kv.set(`feeds:${feed.id}`, feed);
  }

  async getFeed(feedId: string): Promise<Feed | null> {
    return await kv.get(`feeds:${feedId}`);
  }

  async getAllFeeds(): Promise<Feed[]> {
    const keys = await kv.keys('feeds:*');
    const feeds: Feed[] = [];
    
    for (const key of keys) {
      const feed = await kv.get(key);
      if (feed) feeds.push(feed as Feed);
    }
    
    return feeds.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getActiveFeeds(): Promise<Feed[]> {
    const allFeeds = await this.getAllFeeds();
    return allFeeds.filter(feed => feed.active);
  }

  async deleteFeed(feedId: string): Promise<void> {
    await kv.del(`feeds:${feedId}`);
    await kv.del(`feed_history:${feedId}`);
  }

  // フィード履歴管理
  async saveFeedHistory(feedId: string, history: FeedHistory): Promise<void> {
    await kv.set(`feed_history:${feedId}`, history);
  }

  async getFeedHistory(feedId: string): Promise<FeedHistory | null> {
    return await kv.get(`feed_history:${feedId}`);
  }

  // グローバル設定管理
  async getGlobalConfig(): Promise<GlobalConfig> {
    const config = await kv.get('global_config');
    return config as GlobalConfig || {
      feedCounter: 0,
      lastGlobalUpdate: new Date().toISOString(),
      openbd: {
        lastFetch: new Date().toISOString(),
        maxBooksPerRequest: 1000
      }
    };
  }

  async saveGlobalConfig(config: GlobalConfig): Promise<void> {
    await kv.set('global_config', config);
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

  // RSS ファイル管理（Vercel Blob Storage代替）
  async saveRSSContent(feedId: string, content: string): Promise<void> {
    await kv.set(`rss:${feedId}`, content);
  }

  async getRSSContent(feedId: string): Promise<string | null> {
    return await kv.get(`rss:${feedId}`);
  }

  // フィード一覧インデックス管理
  async updateFeedIndex(): Promise<void> {
    const feeds = await this.getAllFeeds();
    const feedIndex = feeds.map(feed => ({
      id: feed.id,
      name: feed.name,
      criteria: feed.criteria,
      createdAt: feed.createdAt,
      lastUpdated: feed.lastUpdated,
      itemCount: 0 // TODO: RSS アイテム数を取得
    }));

    await kv.set('feed_index', {
      feeds: feedIndex,
      totalFeeds: feedIndex.length,
      lastUpdated: new Date().toISOString()
    });
  }
}