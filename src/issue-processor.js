import { FeedManager } from './feed-manager.js';

export class IssueProcessor {
  constructor() {
    this.feedManager = new FeedManager();
  }

  // GitHub Issueを処理
  async processIssue(issueData) {
    try {
      console.log(`Processing issue: ${issueData.title}`);
      
      // フィード作成リクエストかどうかを判定
      if (!this.isFeedRequest(issueData)) {
        console.log('Not a feed request issue');
        return null;
      }

      // フィード設定を作成
      const feedConfig = await this.feedManager.processIssueRequest(issueData.body);
      
      console.log(`Created feed: ${feedConfig.name} (${feedConfig.id})`);
      
      return feedConfig;
    } catch (error) {
      console.error('Error processing issue:', error);
      throw error;
    }
  }

  // フィード作成リクエストかどうかを判定
  isFeedRequest(issueData) {
    return (
      issueData.title.includes('新しいフィード作成リクエスト') ||
      (issueData.labels && issueData.labels.some(label => 
        label.name === 'feed-request'
      ))
    );
  }

  // 複数のIssueを一括処理
  async processMultipleIssues(issues) {
    const results = [];
    
    for (const issue of issues) {
      try {
        const result = await this.processIssue(issue);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error processing issue ${issue.number}:`, error);
      }
    }
    
    return results;
  }

  // 処理済みIssueをクローズ
  async markIssueAsProcessed(issueNumber, feedId) {
    console.log(`Issue ${issueNumber} processed, created feed ${feedId}`);
    // 実際のGitHub APIコールは本番環境で実装
    // この関数は処理ログとして機能
  }
}