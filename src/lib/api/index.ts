import { fetchNewsHeadlines, fetchNewsByDomains } from './news';
import { fetchTrending, fetchTMDBByDomains } from './tmdb';
import { fetchRedditByDomains, fetchTrendingReddit } from './reddit';
import type { UnifiedContent, ContentFeedResponse, FetchOptions, ContentSource } from '@/types/content';
import { DEFAULT_DOMAINS, type Domain } from '@/config/domains';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function sortContent(content: UnifiedContent[], sortBy: FetchOptions['sortBy'] = 'date'): UnifiedContent[] {
  const sorted = [...content];
  
  switch (sortBy) {
    case 'score':
      return sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    case 'relevance':
      return sorted.sort((a, b) => {
        const scoreA = (a.score ?? 0) + (new Date(a.publishedAt).getTime() / 1000000000);
        const scoreB = (b.score ?? 0) + (new Date(b.publishedAt).getTime() / 1000000000);
        return scoreB - scoreA;
      });
    case 'date':
    default:
      return sorted.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
  }
}

function interleaveContent(content: UnifiedContent[]): UnifiedContent[] {
  const bySource: Record<ContentSource, UnifiedContent[]> = {
    news: [],
    tmdb: [],
    reddit: [],
  };
  
  for (const item of content) {
    bySource[item.source].push(item);
  }
  
  // Interleave
  const result: UnifiedContent[] = [];
  const maxLength = Math.max(...Object.values(bySource).map(arr => arr.length));
  
  for (let i = 0; i < maxLength; i++) {
    for (const source of ['reddit', 'news', 'tmdb'] as ContentSource[]) {
      if (bySource[source][i]) {
        result.push(bySource[source][i]);
      }
    }
  }
  
  return result;
}

// Main function to fetch unified content feed
export async function fetchContentFeed(options: FetchOptions = {}): Promise<ContentFeedResponse> {
  const {
    domains = DEFAULT_DOMAINS,
    page = 1,
    pageSize = 20,
    sortBy = 'date',
    sources = ['news', 'tmdb', 'reddit'],
  } = options;

  const startTime = Date.now();
  const allContent: UnifiedContent[] = [];
  const sourceResults: ContentFeedResponse['sources'] = [];

  // Fetch from each enabled source in parallel
  const fetchPromises: Promise<void>[] = [];

  if (sources.includes('news')) {
    fetchPromises.push(
      fetchNewsByDomains(domains, { pageSize: Math.ceil(pageSize / 3) })
        .then(response => {
          sourceResults.push({
            source: 'news',
            count: response.data?.length ?? 0,
            error: response.error ?? undefined,
          });
          if (response.data) {
            allContent.push(...response.data);
          }
        })
    );
  }

  if (sources.includes('tmdb')) {
    fetchPromises.push(
      fetchTMDBByDomains(domains, { page })
        .then(response => {
          sourceResults.push({
            source: 'tmdb',
            count: response.data?.length ?? 0,
            error: response.error ?? undefined,
          });
          if (response.data) {
            allContent.push(...response.data);
          }
        })
    );
  }

  if (sources.includes('reddit')) {
    fetchPromises.push(
      fetchRedditByDomains(domains, { limit: Math.ceil(pageSize / 2) })
        .then(response => {
          sourceResults.push({
            source: 'reddit',
            count: response.data?.length ?? 0,
            error: response.error ?? undefined,
          });
          if (response.data) {
            allContent.push(...response.data);
          }
        })
    );
  }

  await Promise.all(fetchPromises);

  // Process content
  let processedContent = sortContent(allContent, sortBy);
  
  // Interleave for variety if sorting by date
  if (sortBy === 'date') {
    processedContent = interleaveContent(processedContent);
  }

  // Paginate
  const startIndex = (page - 1) * pageSize;
  const paginatedContent = processedContent.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedContent,
    total: processedContent.length,
    page,
    pageSize,
    hasMore: startIndex + pageSize < processedContent.length,
    fetchedAt: new Date().toISOString(),
    sources: sourceResults,
  };
}

// Fetch trending content across all sources
export async function fetchTrendingFeed(options: { pageSize?: number } = {}): Promise<ContentFeedResponse> {
  const { pageSize = 30 } = options;
  const startTime = Date.now();
  const allContent: UnifiedContent[] = [];
  const sourceResults: ContentFeedResponse['sources'] = [];

  // Fetch trending from each source
  const [newsResponse, tmdbResponse, redditResponse] = await Promise.all([
    fetchNewsHeadlines('general', { pageSize: 10 }),
    fetchTrending('all', 'day'),
    fetchTrendingReddit({ limit: 15 }),
  ]);

  // Process news
  sourceResults.push({
    source: 'news',
    count: newsResponse.data?.length ?? 0,
    error: newsResponse.error ?? undefined,
  });
  if (newsResponse.data) allContent.push(...newsResponse.data);

  // Process TMDB
  sourceResults.push({
    source: 'tmdb',
    count: tmdbResponse.data?.length ?? 0,
    error: tmdbResponse.error ?? undefined,
  });
  if (tmdbResponse.data) allContent.push(...tmdbResponse.data);

  // Process Reddit
  sourceResults.push({
    source: 'reddit',
    count: redditResponse.data?.length ?? 0,
    error: redditResponse.error ?? undefined,
  });
  if (redditResponse.data) allContent.push(...redditResponse.data);

  // Sort by score for trending
  const sortedContent = sortContent(allContent, 'score').slice(0, pageSize);

  return {
    items: sortedContent,
    total: sortedContent.length,
    page: 1,
    pageSize,
    hasMore: false,
    fetchedAt: new Date().toISOString(),
    sources: sourceResults,
  };
}

// Re-export individual API functions for direct use
export { fetchNewsHeadlines, searchNews } from './news';
export { fetchTrending, fetchPopularMovies, fetchPopularTV, searchMovies } from './tmdb';
export { fetchSubreddit, searchReddit, fetchTrendingReddit } from './reddit';
