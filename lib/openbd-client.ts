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
    
    // ISBN取得
    const isbn = onix.ProductIdentifier?.find(
      id => id.ProductIDType === '15'
    )?.IDValue || summary?.isbn || '';

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
      isbn,
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
}