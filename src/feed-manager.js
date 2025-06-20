import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class FeedManager {
  constructor(feedsDir = 'docs/feeds', configDir = 'data/feeds') {
    this.feedsDir = feedsDir;
    this.configDir = configDir;
  }

  // ユーザーフィード設定を作成
  async createUserFeed(feedRequest) {
    // 入力値の検証
    const validation = this.validateFeedRequest(feedRequest);
    if (!validation.isValid) {
      throw new Error(`Invalid feed request: ${validation.errors.join(', ')}`);
    }

    // フィード数制限の確認
    const currentFeeds = await this.loadAllFeedConfigs();
    if (currentFeeds.length >= 1000) {
      throw new Error('Maximum number of feeds (1000) reached');
    }

    const feedId = this.generateFeedId(feedRequest);
    const feedConfig = {
      id: feedId,
      name: feedRequest.feedName,
      criteria: {
        seriesName: feedRequest.seriesName || '',
        titleKeyword: feedRequest.titleKeyword || '',
        publisher: feedRequest.publisher || '',
        ccode: feedRequest.ccode || '',
        ccodeMatchType: feedRequest.ccodeMatchType || 'prefix'
      },
      createdAt: new Date().toISOString(),
      lastUpdated: null,
      active: true
    };

    // フィード設定を保存
    await this.saveFeedConfig(feedId, feedConfig);
    
    // インデックスを更新
    await this.updateFeedIndex();
    
    return feedConfig;
  }

  // フィードリクエストの検証
  validateFeedRequest(feedRequest) {
    const errors = [];

    // 必須項目のチェック
    if (!feedRequest.feedName || feedRequest.feedName.trim().length === 0) {
      errors.push('Feed name is required');
    } else if (feedRequest.feedName.length > 100) {
      errors.push('Feed name must be 100 characters or less');
    }


    // 検索条件のチェック（少なくとも一つは必要）
    const hasSearchCriteria = (
      (feedRequest.seriesName && feedRequest.seriesName.trim().length > 0) ||
      (feedRequest.titleKeyword && feedRequest.titleKeyword.trim().length > 0) ||
      (feedRequest.publisher && feedRequest.publisher.trim().length > 0) ||
      (feedRequest.ccode && feedRequest.ccode.trim().length > 0)
    );

    if (!hasSearchCriteria) {
      errors.push('At least one search criterion is required');
    }

    // 各フィールドの長さ制限
    if (feedRequest.seriesName && feedRequest.seriesName.length > 200) {
      errors.push('Series name must be 200 characters or less');
    }
    if (feedRequest.titleKeyword && feedRequest.titleKeyword.length > 200) {
      errors.push('Title keyword must be 200 characters or less');
    }
    if (feedRequest.publisher && feedRequest.publisher.length > 200) {
      errors.push('Publisher name must be 200 characters or less');
    }
    if (feedRequest.ccode && feedRequest.ccode.length > 10) {
      errors.push('C-code must be 10 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }


  // フィードIDを生成
  generateFeedId(feedRequest) {
    const hash = crypto.createHash('md5');
    hash.update(`${feedRequest.feedName}-${Date.now()}-${Math.random()}`);
    return hash.digest('hex').substring(0, 12);
  }

  // フィード設定を保存
  async saveFeedConfig(feedId, config) {
    await fs.mkdir(this.configDir, { recursive: true });
    const configPath = path.join(this.configDir, `${feedId}.json`);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  // すべてのフィード設定を読み込み
  async loadAllFeedConfigs() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
      const files = await fs.readdir(this.configDir);
      const configs = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const configPath = path.join(this.configDir, file);
            const configData = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configData);
            if (config.active) {
              configs.push(config);
            }
          } catch (error) {
            console.error(`Error loading feed config ${file}:`, error);
          }
        }
      }

      return configs;
    } catch (error) {
      console.error('Error loading feed configs:', error);
      return [];
    }
  }

  // フィードインデックスを更新
  async updateFeedIndex() {
    try {
      const configs = await this.loadAllFeedConfigs();
      const publicConfigs = configs.map(config => ({
        id: config.id,
        name: config.name,
        criteria: config.criteria,
        createdAt: config.createdAt,
        lastUpdated: config.lastUpdated
      }));

      await fs.mkdir(this.feedsDir, { recursive: true });
      const indexPath = path.join(this.feedsDir, 'index.json');
      await fs.writeFile(indexPath, JSON.stringify(publicConfigs, null, 2));
    } catch (error) {
      console.error('Error updating feed index:', error);
    }
  }

  // フィード設定を更新
  async updateFeedConfig(feedId, updates) {
    try {
      const configPath = path.join(this.configDir, `${feedId}.json`);
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      Object.assign(config, updates);
      
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      await this.updateFeedIndex();
      
      return config;
    } catch (error) {
      console.error(`Error updating feed config ${feedId}:`, error);
      throw error;
    }
  }

  // フィードを無効化
  async deactivateFeed(feedId) {
    return await this.updateFeedConfig(feedId, { active: false });
  }

  // GitHub Issueからフィードリクエストを処理
  async processIssueRequest(issueBody) {
    const feedRequest = this.parseIssueBody(issueBody);
    if (feedRequest) {
      return await this.createUserFeed(feedRequest);
    }
    throw new Error('Invalid feed request format');
  }

  // GitHub Issueの本文を解析
  parseIssueBody(body) {
    const lines = body.split('\n');
    const feedRequest = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('フィード名:')) {
        feedRequest.feedName = trimmed.replace('フィード名:', '').trim();
      } else if (trimmed.startsWith('シリーズ名/レーベル名:')) {
        const value = trimmed.replace('シリーズ名/レーベル名:', '').trim();
        feedRequest.seriesName = value === '(なし)' ? '' : value;
      } else if (trimmed.startsWith('書名キーワード:')) {
        const value = trimmed.replace('書名キーワード:', '').trim();
        feedRequest.titleKeyword = value === '(なし)' ? '' : value;
      } else if (trimmed.startsWith('発行元出版社:')) {
        const value = trimmed.replace('発行元出版社:', '').trim();
        feedRequest.publisher = value === '(なし)' ? '' : value;
      } else if (trimmed.startsWith('Cコード:')) {
        const value = trimmed.replace('Cコード:', '').trim();
        feedRequest.ccode = value === '(なし)' ? '' : value;
      } else if (trimmed.startsWith('Cコード検索方法:')) {
        const value = trimmed.replace('Cコード検索方法:', '').trim();
        feedRequest.ccodeMatchType = value || 'prefix';
      }
    }

    // 必須項目のチェック
    if (feedRequest.feedName) {
      return feedRequest;
    }

    return null;
  }

  // フィード統計を取得
  async getFeedStats() {
    const configs = await this.loadAllFeedConfigs();
    return {
      totalFeeds: configs.length,
      activeFeeds: configs.filter(c => c.active).length,
      lastMonth: configs.filter(c => {
        const created = new Date(c.createdAt);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return created > monthAgo;
      }).length
    };
  }
}