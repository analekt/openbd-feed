import fetch from 'node-fetch';

export class OpenBDClient {
  constructor() {
    this.baseUrl = 'https://api.openbd.jp/v1';
  }

  async getLatestBooks(limit = 1000) {
    try {
      // OpenBDは直接最新N件を取得するAPIがないため、
      // 最近のISBN範囲から取得する方法を使用
      const recentIsbns = this.generateRecentIsbnRange(limit);
      const url = `${this.baseUrl}/get?isbn=${recentIsbns.join(',')}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // nullでない有効なデータのみフィルター
      const validBooks = data.filter(book => book !== null);
      
      // 日付順でソート（新しい順）
      return validBooks.sort((a, b) => {
        const dateA = this.getBookDate(a);
        const dateB = this.getBookDate(b);
        return new Date(dateB) - new Date(dateA);
      }).slice(0, limit);
      
    } catch (error) {
      console.error('Error fetching books from OpenBD:', error);
      throw error;
    }
  }

  generateRecentIsbnRange(limit) {
    const isbns = [];
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1; // 過去1年分
    
    // 簡単なISBN生成（実際にはより複雑な方法が必要）
    for (let year = startYear; year <= currentYear; year++) {
      for (let month = 1; month <= 12; month++) {
        if (isbns.length >= limit) break;
        
        // 978で始まる13桁ISBN（簡略化）
        const isbn = `978${year}${month.toString().padStart(2, '0')}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
        isbns.push(isbn);
      }
    }
    
    return isbns.slice(0, limit);
  }

  getBookDate(book) {
    // 複数の日付フィールドから最適なものを選択
    if (book.hanmoto?.datecreated) {
      return book.hanmoto.datecreated;
    }
    if (book.onix?.PublishingDetail?.PublishingDate?.[0]?.Date) {
      return book.onix.PublishingDetail.PublishingDate[0].Date;
    }
    if (book.hanmoto?.datemodified) {
      return book.hanmoto.datemodified;
    }
    return new Date().toISOString();
  }

  async getCoverage() {
    try {
      const response = await fetch(`${this.baseUrl}/coverage`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching coverage:', error);
      throw error;
    }
  }
}