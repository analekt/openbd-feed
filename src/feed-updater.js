import fs from 'fs/promises';
import path from 'path';
import { OpenBDClient } from './openbd-client.js';
import { BookMatcher } from './book-matcher.js';
import { RSSGenerator } from './rss-generator.js';
import { FeedManager } from './feed-manager.js';

export class FeedUpdater {
  constructor() {
    this.feedManager = new FeedManager();
    this.historyPath = 'data/global-history.json';
  }

  async updateAllFeeds() {
    try {
      console.log('Starting all feeds update...');
      
      // すべてのフィード設定を読み込み
      const feedConfigs = await this.feedManager.loadAllFeedConfigs();
      console.log(`Found ${feedConfigs.length} active feeds`);
      
      if (feedConfigs.length === 0) {
        console.log('No active feeds found');
        return;
      }
      
      // グローバル履歴の読み込み
      const globalHistory = await this.loadGlobalHistory();
      
      // OpenBD APIクライアントの初期化
      const client = new OpenBDClient();
      
      // 最新1000件の書籍データを取得
      console.log('Fetching latest books from OpenBD...');
      const books = await client.getLatestBooks(1000);
      
      // 各フィードを処理
      for (const feedConfig of feedConfigs) {
        try {
          await this.updateSingleFeed(feedConfig, books, globalHistory);
        } catch (error) {
          console.error(`Error updating feed ${feedConfig.id}:`, error);
        }
      }
      
      // グローバル履歴を保存
      await this.saveGlobalHistory(globalHistory);
      
      console.log('All feeds update completed');
      
    } catch (error) {
      console.error('Error updating feeds:', error);
      throw error;
    }
  }

  async updateSingleFeed(feedConfig, books, globalHistory) {
    console.log(`Updating feed: ${feedConfig.name} (${feedConfig.id})`);
    
    // 書籍マッチャーの初期化
    const matcher = new BookMatcher([feedConfig.criteria]);
    
    // フィード固有の履歴を読み込み
    const feedHistory = await this.loadFeedHistory(feedConfig.id);
    
    // 新しい一致する書籍を検索
    const matchedBooks = books.filter(book => {
      const isbn = matcher.getBookDetails(book).isbn;
      return matcher.matchBook(book) && 
             !feedHistory.processedIsbns.includes(isbn) &&
             !globalHistory.processedIsbns.includes(isbn);
    });
    
    console.log(`Found ${matchedBooks.length} new matching books for feed ${feedConfig.id}`);
    
    if (matchedBooks.length > 0) {
      // 新しい書籍の詳細情報を取得
      const bookDetails = matchedBooks.map(book => matcher.getBookDetails(book));
      
      // RSSフィードを生成
      const feedRssConfig = {
        title: feedConfig.name,
        description: `${feedConfig.name} - OpenBD新刊フィード`,
        siteUrl: `https://analekt.github.io/opendb-feed/`,
        feedUrl: `https://analekt.github.io/opendb-feed/feeds/${feedConfig.id}.xml`
      };
      
      const rssGenerator = new RSSGenerator(feedRssConfig);
      const existingFeedBooks = await this.loadExistingFeedBooks(feedConfig.id);
      const allBooks = [...bookDetails, ...existingFeedBooks].slice(0, 50); // 最新50件を保持
      
      const rssXml = rssGenerator.generateFeed(allBooks);
      
      // RSSフィードをファイルに保存
      await this.saveFeedFile(feedConfig.id, rssXml);
      
      // 履歴を更新
      const newIsbns = bookDetails.map(book => book.isbn);
      feedHistory.processedIsbns.push(...newIsbns);
      globalHistory.processedIsbns.push(...newIsbns);
      
      feedHistory.lastUpdated = new Date().toISOString();
      
      // 履歴を500件に制限
      if (feedHistory.processedIsbns.length > 500) {
        feedHistory.processedIsbns = feedHistory.processedIsbns.slice(-500);
      }
      
      await this.saveFeedHistory(feedConfig.id, feedHistory);
      
      // フィード設定の最終更新日を更新
      await this.feedManager.updateFeedConfig(feedConfig.id, {
        lastUpdated: new Date().toISOString()
      });
      
      console.log(`Updated feed ${feedConfig.id} with ${matchedBooks.length} new books`);
    }
  }

  async loadGlobalHistory() {
    try {
      const historyData = await fs.readFile(this.historyPath, 'utf-8');
      return JSON.parse(historyData);
    } catch (error) {
      // 履歴ファイルが存在しない場合は初期化
      return {
        processedIsbns: [],
        lastUpdated: null
      };
    }
  }

  async saveGlobalHistory(history) {
    try {
      await fs.mkdir(path.dirname(this.historyPath), { recursive: true });
      
      // グローバル履歴を2000件に制限
      if (history.processedIsbns.length > 2000) {
        history.processedIsbns = history.processedIsbns.slice(-2000);
      }
      
      history.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      throw new Error(`Failed to save global history: ${error.message}`);
    }
  }

  async loadFeedHistory(feedId) {
    try {
      const historyPath = `data/feeds/${feedId}-history.json`;
      const historyData = await fs.readFile(historyPath, 'utf-8');
      return JSON.parse(historyData);
    } catch (error) {
      // 履歴ファイルが存在しない場合は初期化
      return {
        processedIsbns: [],
        lastUpdated: null
      };
    }
  }

  async saveFeedHistory(feedId, history) {
    try {
      const historyPath = `data/feeds/${feedId}-history.json`;
      await fs.mkdir(path.dirname(historyPath), { recursive: true });
      await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      throw new Error(`Failed to save feed history: ${error.message}`);
    }
  }

  async loadExistingFeedBooks(feedId) {
    try {
      const feedPath = `docs/feeds/${feedId}.xml`;
      const feedData = await fs.readFile(feedPath, 'utf-8');
      
      // 簡単なXMLパースでアイテムを抽出（実際にはより堅牢なパーサーが必要）
      const items = [];
      const itemMatches = feedData.match(/<item>.*?<\/item>/gs);
      
      if (itemMatches) {
        itemMatches.forEach(itemXml => {
          const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
          const guidMatch = itemXml.match(/<guid.*?>(.*?)<\/guid>/);
          const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
          
          if (titleMatch && guidMatch) {
            items.push({
              title: titleMatch[1],
              isbn: guidMatch[1],
              publishDate: dateMatch ? dateMatch[1] : new Date().toISOString()
            });
          }
        });
      }
      
      return items;
    } catch (error) {
      // 既存のフィードがない場合は空配列を返す
      return [];
    }
  }

  async saveFeedFile(feedId, rssXml) {
    try {
      await fs.mkdir('docs/feeds', { recursive: true });
      const feedPath = `docs/feeds/${feedId}.xml`;
      await fs.writeFile(feedPath, rssXml);
      console.log(`RSS feed saved to ${feedPath}`);
    } catch (error) {
      throw new Error(`Failed to save feed: ${error.message}`);
    }
  }
}