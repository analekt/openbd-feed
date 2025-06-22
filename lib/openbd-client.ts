import { OpenBDBook } from '../types/openbd.js';

export class OpenBDClient {
  private readonly baseUrl = 'https://api.openbd.jp/v1';

  async getLatestBooks(limit: number = 1000): Promise<OpenBDBook[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get?isbn=*&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`OpenBD API error: ${response.status}`);
      }

      const books: (OpenBDBook | null)[] = await response.json();
      return books.filter((book): book is OpenBDBook => book !== null);
    } catch (error) {
      console.error('Failed to fetch books from OpenBD:', error);
      throw error;
    }
  }

  async getCoverageData(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/coverage`);
      
      if (!response.ok) {
        throw new Error(`OpenBD coverage API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch coverage data from OpenBD:', error);
      throw error;
    }
  }

  extractBookInfo(book: OpenBDBook) {
    const onix = book.onix;
    const summary = book.summary;
    
    // ISBN取得（13桁）
    const isbn13 = onix.ProductIdentifier?.find(
      id => id.ProductIDType === '15'
    )?.IDValue || summary?.isbn || '';
    
    // ISBN取得（10桁）
    const isbn10 = onix.ProductIdentifier?.find(
      id => id.ProductIDType === '02'
    )?.IDValue || this.convertISBN13to10(isbn13);

    // タイトル取得
    const titleElement = onix.DescriptiveDetail.TitleDetail?.[0]?.TitleElement?.[0];
    const title = titleElement?.TitleText?.content || summary?.title || '';

    // 著者取得
    const author = onix.DescriptiveDetail.Contributor?.find(
      c => c.ContributorRole.includes('A01')
    )?.PersonName?.content || summary?.author || '';

    // 出版社取得
    const publisher = onix.PublishingDetail.Publisher?.PublisherName || 
                     onix.PublishingDetail.Imprint?.ImprintName || 
                     summary?.publisher || '';

    // 出版日取得
    const pubDate = onix.PublishingDetail.PublishingDate?.find(
      d => d.PublishingDateRole === '01'
    )?.Date || summary?.pubdate || '';

    // シリーズ/レーベル取得
    const series = summary?.series || '';

    // Cコード取得
    const ccode = onix.DescriptiveDetail.Subject?.find(
      s => s.SubjectSchemeIdentifier === '78'
    )?.SubjectCode || '';

    // 表紙画像取得
    const cover = summary?.cover || '';

    // 商品説明取得
    const description = onix.CollateralDetail?.TextContent?.find(
      t => t.TextType === '03'
    )?.Text || '';

    return {
      isbn13,
      isbn10,
      isbn: isbn13, // 後方互換性のため
      title,
      author,
      publisher,
      pubDate,
      series,
      ccode,
      cover,
      description,
      volume: summary?.volume || ''
    };
  }

  // ISBN-13からISBN-10に変換
  private convertISBN13to10(isbn13: string): string {
    if (!isbn13 || isbn13.length !== 13) return '';
    
    // 978で始まる場合のみ変換可能
    if (!isbn13.startsWith('978')) return '';
    
    // 最初の3桁（978）を除去して9桁取得
    const isbn9 = isbn13.substring(3, 12);
    
    // チェックディジット計算
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn9[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 'X' : 11 - remainder;
    
    return isbn9 + checkDigit;
  }

  // Amazonアフィリエイトリンク生成
  generateAmazonLink(isbn10: string, associateId: string = 'bookfeed-22'): string {
    if (!isbn10) return '';
    
    // ハイフンを除去
    const cleanIsbn = isbn10.replace(/-/g, '');
    
    return `https://www.amazon.co.jp/dp/${cleanIsbn}?tag=${associateId}`;
  }
}