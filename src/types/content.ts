// Unified Content Types with Domain Tagging

import type { Domain } from '@/config/domains';

// Content source types
export type ContentSource = 'news' | 'tmdb' | 'reddit';

// Base content interface - all content types extend this
export interface BaseContent {
  // Unique identifier (source:id format)
  id: string;
  
  // Source information
  source: ContentSource;
  sourceId: string; // Original ID from the API
  sourceName: string; // e.g., "NewsAPI", "TMDB", "Reddit"
  sourceUrl: string; // Link to original content
  
  // Domain tagging for preferences
  domains: Domain[];
  primaryDomain: Domain;
  
  // Core content
  title: string;
  description: string | null;
  content: string | null; // Full content if available
  
  // Media
  thumbnail: string | null;
  image: string | null;
  images: string[];
  
  // Metadata
  author: string | null;
  publishedAt: string; // ISO date string
  fetchedAt: string; // When we fetched this
  
  // Engagement (if available)
  score: number | null; // Upvotes, likes, etc.
  comments: number | null;
  shares: number | null;
  
  // Internal tracking
  viewCount: number;
  isFavorite: boolean;
  isRead: boolean;
  
  // Raw data for debugging
  _raw?: unknown;
}

// News-specific content
export interface NewsContent extends BaseContent {
  source: 'news';
  category: string;
  sourceSite: string; // BBC, CNN, etc.
}

// TMDB-specific content
export interface TMDBContent extends BaseContent {
  source: 'tmdb';
  mediaType: 'movie' | 'tv';
  rating: number;
  releaseDate: string;
  genres: number[];
  genreNames: string[];
  popularity: number;
  voteCount: number;
  backdropImage: string | null;
}

// Reddit-specific content
export interface RedditContent extends BaseContent {
  source: 'reddit';
  subreddit: string;
  subredditId: string;
  upvotes: number;
  downvotes: number;
  upvoteRatio: number;
  isNsfw: boolean;
  isSpoiler: boolean;
  flair: string | null;
  postType: 'link' | 'text' | 'image' | 'video' | 'gallery';
  permalink: string;
}

// Union type for all content
export type UnifiedContent = NewsContent | TMDBContent | RedditContent;

// Content feed response
export interface ContentFeedResponse {
  items: UnifiedContent[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  fetchedAt: string;
  sources: {
    source: ContentSource;
    count: number;
    error?: string;
  }[];
}

// Fetch options
export interface FetchOptions {
  domains?: Domain[];
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'score' | 'relevance';
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'all';
  sources?: ContentSource[];
  searchQuery?: string;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: {
    source: ContentSource;
    fetchedAt: string;
    requestDuration: number;
    cached: boolean;
  };
}
