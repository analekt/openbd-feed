import { OpenBDBook, FeedCriteria } from '../types/index.js';
import { OpenBDClient } from './openbd-client.js';

export class BookMatcher {
  private openBDClient = new OpenBDClient();

  matchesCriteria(book: OpenBDBook, criteria: FeedCriteria): boolean {
    const bookInfo = this.openBDClient.extractBookInfo(book);

    // シリーズ名/レーベル名チェック（完全一致）
    if (criteria.seriesName && criteria.seriesName.trim()) {
      if (bookInfo.series !== criteria.seriesName.trim()) {
        return false;
      }
    }

    // 書名チェック（部分一致）
    if (criteria.titleKeyword && criteria.titleKeyword.trim()) {
      const keyword = criteria.titleKeyword.trim().toLowerCase();
      const title = bookInfo.title.toLowerCase();
      if (!title.includes(keyword)) {
        return false;
      }
    }

    // 発行元出版社チェック（完全一致）
    if (criteria.publisher && criteria.publisher.trim()) {
      if (bookInfo.publisher !== criteria.publisher.trim()) {
        return false;
      }
    }

    // Cコードチェック（マッチングタイプに応じて）
    if (criteria.ccode && criteria.ccode.trim()) {
      const targetCcode = criteria.ccode.trim();
      const bookCcode = bookInfo.ccode;
      
      if (!bookCcode) {
        return false;
      }

      switch (criteria.ccodeMatchType) {
        case 'exact':
          if (bookCcode !== targetCcode) {
            return false;
          }
          break;
        case 'prefix':
          if (!bookCcode.startsWith(targetCcode)) {
            return false;
          }
          break;
        case 'suffix':
          if (!bookCcode.endsWith(targetCcode)) {
            return false;
          }
          break;
        default:
          return false;
      }
    }

    return true;
  }

  validateCriteria(criteria: FeedCriteria): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 少なくとも一つの条件が必要
    const hasCondition = criteria.seriesName || 
                        criteria.titleKeyword || 
                        criteria.publisher || 
                        criteria.ccode;

    if (!hasCondition) {
      errors.push('少なくとも一つの検索条件を入力してください');
    }

    // 文字数制限チェック
    if (criteria.seriesName && criteria.seriesName.length > 200) {
      errors.push('シリーズ名/レーベル名は200文字以内で入力してください');
    }

    if (criteria.titleKeyword && criteria.titleKeyword.length > 200) {
      errors.push('書名キーワードは200文字以内で入力してください');
    }

    if (criteria.publisher && criteria.publisher.length > 200) {
      errors.push('発行元出版社は200文字以内で入力してください');
    }

    if (criteria.ccode && criteria.ccode.length > 10) {
      errors.push('Cコードは10文字以内で入力してください');
    }

    // Cコードの形式チェック
    if (criteria.ccode && !/^[0-9]+$/.test(criteria.ccode)) {
      errors.push('Cコードは数字のみで入力してください');
    }

    // マッチングタイプの検証
    const validMatchTypes = ['exact', 'prefix', 'suffix'];
    if (!validMatchTypes.includes(criteria.ccodeMatchType)) {
      errors.push('Cコードマッチングタイプが無効です');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async findMatchingBooks(criteria: FeedCriteria, limit: number = 1000): Promise<OpenBDBook[]> {
    const books = await this.openBDClient.getLatestBooks(limit);
    return books.filter(book => this.matchesCriteria(book, criteria));
  }
}