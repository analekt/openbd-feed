import RSS from 'rss';

export class RSSGenerator {
  constructor(feedConfig) {
    this.feedConfig = feedConfig;
  }

  generateFeed(books) {
    const feed = new RSS({
      title: this.feedConfig.title,
      description: this.feedConfig.description,
      feed_url: this.feedConfig.feedUrl,
      site_url: this.feedConfig.siteUrl,
      language: 'ja',
      ttl: 1440 // 24時間
    });

    books.forEach(book => {
      const item = this.createFeedItem(book);
      feed.item(item);
    });

    return feed.xml();
  }

  createFeedItem(bookDetails) {
    const title = bookDetails.title || 'タイトル不明';
    const description = this.createDescription(bookDetails);
    
    return {
      title: title,
      description: description,
      url: `https://api.openbd.jp/v1/get?isbn=${bookDetails.isbn}`,
      guid: bookDetails.isbn,
      date: bookDetails.publishDate || new Date().toISOString()
    };
  }

  createDescription(book) {
    const parts = [];
    
    if (book.isbn) {
      parts.push(`ISBN: ${book.isbn}`);
    }
    
    if (book.seriesName) {
      parts.push(`シリーズ/レーベル: ${book.seriesName}`);
    }
    
    if (book.title) {
      parts.push(`書名: ${book.title}`);
    }
    
    if (book.subtitle) {
      parts.push(`サブタイトル: ${book.subtitle}`);
    }
    
    if (book.authors) {
      parts.push(`著者: ${book.authors}`);
    }
    
    if (book.authorBio) {
      parts.push(`著者略歴: ${book.authorBio}`);
    }
    
    if (book.ccode) {
      parts.push(`Cコード: ${book.ccode}`);
    }
    
    if (book.publisher) {
      parts.push(`発行元: ${book.publisher}`);
    }
    
    if (book.distributor) {
      parts.push(`発売元: ${book.distributor}`);
    }
    
    if (book.publishDate) {
      parts.push(`発売予定日: ${book.publishDate}`);
    }
    
    if (book.price) {
      parts.push(`価格: ${book.price}`);
    }
    
    if (book.description) {
      parts.push(`説明: ${book.description}`);
    }
    
    return parts.join('<br>');
  }
}