import { OpenBDBook, Feed, FeedHistory } from '../types/index.js';
import { EdgeStorageManager } from './storage-edge.js';
import { OpenBDClient } from './openbd-client.js';
import { BookMatcher } from './book-matcher.js';
import { RSSGenerator } from './rss-generator.js';

export class FeedUpdater {
  private storage = new EdgeStorageManager();
  private openBDClient = new OpenBDClient();
  private bookMatcher = new BookMatcher();
  private rssGenerator = new RSSGenerator();

  async updateAllFeeds(): Promise<{ success: boolean; updatedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let updatedCount = 0;

    try {
      console.log('フィード更新開始...');
      
      // アクティブなフィードを取得
      const activeFeeds = await this.storage.getActiveFeeds();
      console.log(`アクティブフィード数: ${activeFeeds.length}`);

      if (activeFeeds.length === 0) {
        return { success: true, updatedCount: 0, errors: [] };
      }

      // OpenBD から最新の書籍データを取得
      const latestBooks = await this.openBDClient.getLatestBooks(1000);
      console.log(`取得した書籍数: ${latestBooks.length}`);

      // 各フィードを更新
      for (const feed of activeFeeds) {
        try {
          await this.updateSingleFeed(feed, latestBooks);
          updatedCount++;
          console.log(`フィード更新完了: ${feed.name} (${feed.id})`);
        } catch (error) {
          const errorMsg = `フィード ${feed.name} の更新失敗: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // グローバル設定を更新
      const globalConfig = await this.storage.getGlobalConfig();
      globalConfig.lastGlobalUpdate = new Date().toISOString();
      globalConfig.openbd.lastFetch = new Date().toISOString();
      await this.storage.saveGlobalConfig(globalConfig);

      // フィードインデックスを更新
      await this.storage.updateFeedIndex();

      console.log(`フィード更新完了: ${updatedCount}/${activeFeeds.length} 成功`);

      return {
        success: errors.length === 0,
        updatedCount,
        errors
      };

    } catch (error) {
      const errorMsg = `全体更新処理でエラー: ${error}`;
      console.error(errorMsg);
      return {
        success: false,
        updatedCount,
        errors: [errorMsg]
      };
    }
  }

  async updateSingleFeed(feed: Feed, books?: OpenBDBook[]): Promise<void> {
    try {
      // 書籍データが提供されていない場合は取得
      if (!books) {
        books = await this.openBDClient.getLatestBooks(1000);
      }

      // フィード履歴を取得
      const history = await this.storage.getFeedHistory(feed.id) || {
        processedIsbns: [],
        lastProcessedAt: new Date().toISOString(),
        totalProcessed: 0
      };

      // 条件に一致する書籍を検索
      const matchingBooks = books.filter(book => {
        return this.bookMatcher.matchesCriteria(book, feed.criteria);
      });

      // 新しい書籍のみをフィルタリング
      const newBooks = matchingBooks.filter(book => {
        const bookInfo = this.openBDClient.extractBookInfo(book);
        return !history.processedIsbns.includes(bookInfo.isbn);
      });

      console.log(`フィード ${feed.name}: ${matchingBooks.length} 件マッチ, ${newBooks.length} 件新規`);

      // 最大アイテム数制限を適用
      const maxItems = feed.settings.maxItems || 50;
      const allBooksForFeed = matchingBooks.slice(0, maxItems);

      // RSS を生成
      const rssContent = this.rssGenerator.generateRSS(feed, allBooksForFeed);
      
      // RSS をストレージに保存
      await this.storage.saveRSSContent(feed.id, rssContent);

      // 履歴を更新
      const allIsbns = matchingBooks.map(book => {
        return this.openBDClient.extractBookInfo(book).isbn;
      });
      
      const updatedHistory: FeedHistory = {
        processedIsbns: [...new Set([...history.processedIsbns, ...allIsbns])].slice(-1000), // 最新1000件のみ保持
        lastProcessedAt: new Date().toISOString(),
        totalProcessed: history.totalProcessed + newBooks.length
      };

      await this.storage.saveFeedHistory(feed.id, updatedHistory);

      // フィード情報を更新
      const updatedFeed: Feed = {
        ...feed,
        lastUpdated: new Date().toISOString()
      };

      await this.storage.saveFeed(updatedFeed);

    } catch (error) {
      console.error(`フィード ${feed.id} の更新中にエラー:`, error);
      throw error;
    }
  }

  async createInitialFeed(feed: Feed): Promise<void> {
    console.log(`初回フィード生成: ${feed.name} (${feed.id})`);
    
    // 初回は空のフィードを生成
    const rssContent = this.rssGenerator.generateRSS(feed, []);
    await this.storage.saveRSSContent(feed.id, rssContent);

    // 空の履歴を作成
    const initialHistory: FeedHistory = {
      processedIsbns: [],
      lastProcessedAt: new Date().toISOString(),
      totalProcessed: 0
    };

    await this.storage.saveFeedHistory(feed.id, initialHistory);
    
    console.log(`初回フィード生成完了: ${feed.id}`);
  }

  async getUpdateStatus(): Promise<any> {
    const globalConfig = await this.storage.getGlobalConfig();
    const allFeeds = await this.storage.getAllFeeds();
    
    return {
      lastGlobalUpdate: globalConfig.lastGlobalUpdate,
      lastOpenBDFetch: globalConfig.openbd.lastFetch,
      totalFeeds: allFeeds.length,
      activeFeeds: allFeeds.filter(f => f.active).length,
      oldestFeedUpdate: allFeeds.length > 0 ? 
        Math.min(...allFeeds.map(f => new Date(f.lastUpdated).getTime())) : null,
      stats: this.rssGenerator.generateFeedStats(allFeeds)
    };
  }
}