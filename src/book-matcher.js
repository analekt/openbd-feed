export class BookMatcher {
  constructor(searchCriteria) {
    this.searchCriteria = searchCriteria;
  }

  matchBook(book) {
    return this.searchCriteria.some(criteria => this.matchCriteria(book, criteria));
  }

  matchCriteria(book, criteria) {
    // シリーズ名/レーベル名の完全一致チェック
    if (criteria.seriesName && criteria.seriesName.trim() !== '') {
      const seriesName = this.getSeriesName(book);
      if (seriesName !== criteria.seriesName) {
        return false;
      }
    }

    // 書名のキーワード含有チェック（部分一致）
    if (criteria.titleKeyword && criteria.titleKeyword.trim() !== '') {
      const title = this.getTitle(book);
      if (!title.includes(criteria.titleKeyword)) {
        return false;
      }
    }

    // 発行元出版社の完全一致チェック
    if (criteria.publisher && criteria.publisher.trim() !== '') {
      const publisher = this.getPublisher(book);
      if (publisher !== criteria.publisher) {
        return false;
      }
    }

    // Cコードのマッチングチェック
    if (criteria.ccode && criteria.ccode.trim() !== '') {
      const ccode = this.getCcode(book);
      const matchType = criteria.ccodeMatchType || 'prefix';
      
      if (matchType === 'exact') {
        if (ccode !== criteria.ccode) {
          return false;
        }
      } else if (matchType === 'prefix') {
        if (!ccode.startsWith(criteria.ccode)) {
          return false;
        }
      } else if (matchType === 'suffix') {
        if (!ccode.endsWith(criteria.ccode)) {
          return false;
        }
      }
    }

    return true;
  }

  getSeriesName(book) {
    // シリーズ名の取得（複数のフィールドを確認）
    if (book.onix?.DescriptiveDetail?.Collection?.[0]?.TitleDetail?.TitleElement?.[0]?.TitleText) {
      return book.onix.DescriptiveDetail.Collection[0].TitleDetail.TitleElement[0].TitleText;
    }
    if (book.hanmoto?.series) {
      return book.hanmoto.series;
    }
    return '';
  }

  getTitle(book) {
    // 書名の取得
    if (book.onix?.DescriptiveDetail?.TitleDetail?.TitleElement?.[0]?.TitleText) {
      return book.onix.DescriptiveDetail.TitleDetail.TitleElement[0].TitleText;
    }
    if (book.hanmoto?.title) {
      return book.hanmoto.title;
    }
    return '';
  }

  getPublisher(book) {
    // 発行元出版社の取得
    if (book.onix?.PublishingDetail?.Publisher?.[0]?.PublisherName) {
      return book.onix.PublishingDetail.Publisher[0].PublisherName;
    }
    if (book.hanmoto?.publisher) {
      return book.hanmoto.publisher;
    }
    return '';
  }

  getCcode(book) {
    // Cコードの取得
    if (book.hanmoto?.ccode) {
      return book.hanmoto.ccode;
    }
    return '';
  }

  // RSS用の詳細情報を取得
  getBookDetails(book) {
    return {
      isbn: this.getIsbn(book),
      seriesName: this.getSeriesName(book),
      title: this.getTitle(book),
      subtitle: this.getSubtitle(book),
      authors: this.getAuthors(book),
      authorBio: this.getAuthorBio(book),
      ccode: this.getCcode(book),
      publisher: this.getPublisher(book),
      distributor: this.getDistributor(book),
      publishDate: this.getPublishDate(book),
      price: this.getPrice(book),
      description: this.getDescription(book)
    };
  }

  getIsbn(book) {
    if (book.onix?.RecordReference) {
      return book.onix.RecordReference;
    }
    if (book.hanmoto?.isbn) {
      return book.hanmoto.isbn;
    }
    return '';
  }

  getSubtitle(book) {
    if (book.onix?.DescriptiveDetail?.TitleDetail?.TitleElement?.[0]?.Subtitle) {
      return book.onix.DescriptiveDetail.TitleDetail.TitleElement[0].Subtitle;
    }
    return '';
  }

  getAuthors(book) {
    const authors = [];
    if (book.onix?.DescriptiveDetail?.Contributor) {
      book.onix.DescriptiveDetail.Contributor.forEach(contributor => {
        if (contributor.PersonName) {
          authors.push(contributor.PersonName);
        }
      });
    }
    if (book.hanmoto?.author && authors.length === 0) {
      authors.push(book.hanmoto.author);
    }
    return authors.join(', ');
  }

  getAuthorBio(book) {
    if (book.onix?.DescriptiveDetail?.Contributor?.[0]?.BiographicalNote) {
      return book.onix.DescriptiveDetail.Contributor[0].BiographicalNote;
    }
    return '';
  }

  getDistributor(book) {
    // 発売元出版社の取得
    if (book.hanmoto?.distributor) {
      return book.hanmoto.distributor;
    }
    return '';
  }

  getPublishDate(book) {
    if (book.onix?.PublishingDetail?.PublishingDate?.[0]?.Date) {
      return book.onix.PublishingDetail.PublishingDate[0].Date;
    }
    if (book.hanmoto?.pubdate) {
      return book.hanmoto.pubdate;
    }
    return '';
  }

  getPrice(book) {
    if (book.onix?.ProductSupply?.[0]?.SupplyDetail?.Price?.[0]?.PriceAmount) {
      return `${book.onix.ProductSupply[0].SupplyDetail.Price[0].PriceAmount}円`;
    }
    if (book.hanmoto?.price) {
      return `${book.hanmoto.price}円`;
    }
    return '';
  }

  getDescription(book) {
    if (book.onix?.CollateralDetail?.TextContent) {
      const textContent = book.onix.CollateralDetail.TextContent.find(content => 
        content.TextType === '03' || content.TextType === '02'
      );
      if (textContent?.Text) {
        return textContent.Text;
      }
    }
    if (book.hanmoto?.description) {
      return book.hanmoto.description;
    }
    return '';
  }
}