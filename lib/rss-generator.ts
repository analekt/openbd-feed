import { OpenBDBook, Feed, RSSItem } from '../types/index.js';
import { OpenBDClient } from './openbd-client.js';

export class RSSGenerator {
  private openBDClient = new OpenBDClient();

  generateRSS(feed: Feed, books: OpenBDBook[]): string {
    const items = books.map(book => this.createRSSItem(book));
    
    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.escapeXml(feed.name)}</title>
    <link>https://openbd.jp/</link>
    <description>${this.escapeXml(this.generateDescription(feed))}</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://bookfeed.vercel.app/api/feeds/${feed.id}" rel="self" type="application/rss+xml"/>
    <generator>Book Feed Generator v3.0</generator>
    
${items.map(item => this.formatRSSItem(item)).join('\n')}
  </channel>
</rss>`;

    return rssContent;
  }

  private createRSSItem(book: OpenBDBook): RSSItem {
    const bookInfo = this.openBDClient.extractBookInfo(book);
    
    const title = bookInfo.title || '(タイトル不明)';
    const author = bookInfo.author ? ` / ${bookInfo.author}` : '';
    const publisher = bookInfo.publisher ? ` (${bookInfo.publisher})` : '';
    const volume = bookInfo.volume ? ` ${bookInfo.volume}` : '';
    
    const itemTitle = `${title}${volume}${author}${publisher}`;
    
    // 商品ページのURL（OpenBDまたはAmazon等）
    const link = `https://openbd.jp/${bookInfo.isbn}`;
    
    // アイテムの説明文
    let description = `ISBN: ${bookInfo.isbn}`;
    if (bookInfo.description) {
      description += `\n\n${bookInfo.description}`;
    }
    if (bookInfo.ccode) {
      description += `\n\nCコード: ${bookInfo.ccode}`;
    }
    if (bookInfo.cover) {
      description += `\n\n<img src="${bookInfo.cover}" alt="表紙画像" style="max-width: 200px;">`;
    }
    
    return {
      title: itemTitle,
      link,
      description,
      pubDate: bookInfo.pubDate ? new Date(bookInfo.pubDate).toUTCString() : new Date().toUTCString(),
      guid: bookInfo.isbn
    };
  }

  private formatRSSItem(item: RSSItem): string {
    return `    <item>
      <title>${this.escapeXml(item.title)}</title>
      <link>${this.escapeXml(item.link)}</link>
      <description><![CDATA[${item.description}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="false">${this.escapeXml(item.guid)}</guid>
    </item>`;
  }

  private generateDescription(feed: Feed): string {
    const conditions = [];
    
    if (feed.criteria.seriesName) {
      conditions.push(`シリーズ名: ${feed.criteria.seriesName}`);
    }
    if (feed.criteria.titleKeyword) {
      conditions.push(`書名キーワード: ${feed.criteria.titleKeyword}`);
    }
    if (feed.criteria.publisher) {
      conditions.push(`出版社: ${feed.criteria.publisher}`);
    }
    if (feed.criteria.ccode) {
      const matchTypeText = {
        exact: '完全一致',
        prefix: '前方一致', 
        suffix: '後方一致'
      }[feed.criteria.ccodeMatchType];
      conditions.push(`Cコード: ${feed.criteria.ccode} (${matchTypeText})`);
    }
    
    return `New book information feed from OpenBD API. Criteria: ${conditions.join(', ')}`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // フィード統計情報の生成
  generateFeedStats(feeds: Feed[]): any {
    return {
      totalFeeds: feeds.length,
      activeFeeds: feeds.filter(f => f.active).length,
      lastUpdated: new Date().toISOString(),
      feedsByDate: this.groupFeedsByDate(feeds)
    };
  }

  private groupFeedsByDate(feeds: Feed[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    feeds.forEach(feed => {
      const date = feed.createdAt.split('T')[0];
      groups[date] = (groups[date] || 0) + 1;
    });
    
    return groups;
  }
}