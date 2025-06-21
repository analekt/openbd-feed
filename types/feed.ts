export interface FeedCriteria {
  seriesName?: string;
  titleKeyword?: string;
  publisher?: string;
  ccode?: string;
  ccodeMatchType: 'exact' | 'prefix' | 'suffix';
}

export interface Feed {
  id: string;
  name: string;
  criteria: FeedCriteria;
  createdAt: string;
  lastUpdated: string;
  active: boolean;
  settings: {
    maxItems: number;
    updateInterval: 'daily' | 'weekly';
  };
}

export interface FeedHistory {
  processedIsbns: string[];
  lastProcessedAt: string;
  totalProcessed: number;
}

export interface GlobalConfig {
  feedCounter: number;
  lastGlobalUpdate: string;
  openbd: {
    lastFetch: string;
    maxBooksPerRequest: number;
  };
}

export interface FeedStats {
  totalFeeds: number;
  activeFeeds: number;
  totalBooks: number;
  lastUpdateTime: string;
}

export interface CreateFeedRequest {
  feedName: string;
  seriesName?: string;
  titleKeyword?: string;
  publisher?: string;
  ccode?: string;
  ccodeMatchType: 'exact' | 'prefix' | 'suffix';
}

export interface CreateFeedResponse {
  success: boolean;
  feedId?: string;
  feedUrl?: string;
  message: string;
}

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}