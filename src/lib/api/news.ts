import { API_CONFIG, getApiKey } from '@/config/api';
import { NEWS_CATEGORY_TO_DOMAIN, DOMAINS, type Domain } from '@/config/domains';
import type { NewsContent, ApiResponse } from '@/types/content';

interface NewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
  code?: string;
  message?: string;
}

export const NEWS_CATEGORIES = [
  'general',
  'business',
  'entertainment',
  'health',
  'science',
  'sports',
  'technology',
] as const;

export type NewsCategory = typeof NEWS_CATEGORIES[number];

function generateArticleId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function transformArticle(article: NewsApiArticle, category: NewsCategory): NewsContent {
  const domain = NEWS_CATEGORY_TO_DOMAIN[category] || DOMAINS.WORLD;
  const now = new Date().toISOString();
  
  return {
    id: `news:${generateArticleId(article.url)}`,
    source: 'news',
    sourceId: article.url,
    sourceName: 'NewsAPI',
    sourceUrl: article.url,
    
    // Domain tagging
    domains: [domain],
    primaryDomain: domain,
    
    // Content
    title: article.title || 'Untitled',
    description: article.description,
    content: article.content,
    
    // Media
    thumbnail: article.urlToImage,
    image: article.urlToImage,
    images: article.urlToImage ? [article.urlToImage] : [],
    
    // Metadata
    author: article.author,
    publishedAt: article.publishedAt,
    fetchedAt: now,
    
    // News-specific
    category,
    sourceSite: article.source.name,
    
    // Engagement (not available from NewsAPI)
    score: null,
    comments: null,
    shares: null,
    
    // Tracking
    viewCount: 0,
    isFavorite: false,
    isRead: false,
    
    // Debug
    _raw: article,
  };
}

// Fetch top headlines by category
export async function fetchNewsHeadlines(
  category: NewsCategory = 'general',
  options: {
    country?: string;
    pageSize?: number;
    page?: number;
  } = {}
): Promise<ApiResponse<NewsContent[]>> {
  const startTime = Date.now();
  const apiKey = getApiKey('NEWS_API_KEY');
  
  if (!apiKey) {
    console.warn('⚠️ NEWS API: API key not configured');
    return {
      success: false,
      data: null,
      error: 'NEWS_API_KEY not configured. Get one at https://newsapi.org/register',
      meta: {
        source: 'news',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }

  const { country = 'us', pageSize = API_CONFIG.NEWS_API.DEFAULT_PAGE_SIZE, page = 1 } = options;
  
  const params = new URLSearchParams({
    apiKey,
    category,
    country,
    pageSize: String(pageSize),
    page: String(page),
  });

  try {
    const response = await fetch(
      `${API_CONFIG.NEWS_API.BASE_URL}${API_CONFIG.NEWS_API.ENDPOINTS.TOP_HEADLINES}?${params}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    const data: NewsApiResponse = await response.json();

    if (data.status !== 'ok') {
      throw new Error(data.message || 'NewsAPI request failed');
    }

    const articles = data.articles
      .filter(article => article.title && article.title !== '[Removed]')
      .map(article => transformArticle(article, category));

    return {
      success: true,
      data: articles,
      error: null,
      meta: {
        source: 'news',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ NEWS API Error:', errorMessage);
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      meta: {
        source: 'news',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }
}

// Search news articles
export async function searchNews(
  query: string,
  options: {
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
    pageSize?: number;
    page?: number;
    from?: string; // ISO date
    to?: string; // ISO date
  } = {}
): Promise<ApiResponse<NewsContent[]>> {
  const startTime = Date.now();
  const apiKey = getApiKey('NEWS_API_KEY');
  
  if (!apiKey) {
    return {
      success: false,
      data: null,
      error: 'NEWS_API_KEY not configured',
      meta: {
        source: 'news',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }

  const { sortBy = 'publishedAt', pageSize = 20, page = 1, from, to } = options;
  
  const params = new URLSearchParams({
    apiKey,
    q: query,
    sortBy,
    pageSize: String(pageSize),
    page: String(page),
  });

  if (from) params.append('from', from);
  if (to) params.append('to', to);

  try {
    const response = await fetch(
      `${API_CONFIG.NEWS_API.BASE_URL}${API_CONFIG.NEWS_API.ENDPOINTS.EVERYTHING}?${params}`,
      { next: { revalidate: 300 } }
    );

    const data: NewsApiResponse = await response.json();

    if (data.status !== 'ok') {
      throw new Error(data.message || 'NewsAPI search failed');
    }

    const articles = data.articles
      .filter(article => article.title && article.title !== '[Removed]')
      .map(article => transformArticle(article, 'general'));

    return {
      success: true,
      data: articles,
      error: null,
      meta: {
        source: 'news',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ NEWS API Search Error:', errorMessage);
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      meta: {
        source: 'news',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }
}

// Fetch news by multiple categories (for personalized feed)
export async function fetchNewsByDomains(
  targetDomains: Domain[],
  options: { pageSize?: number } = {}
): Promise<ApiResponse<NewsContent[]>> {
  const startTime = Date.now();
  const { pageSize = 5 } = options;
  
  // Map domains to news categories
  const categoriesToFetch = new Set<NewsCategory>();
  
  for (const domain of targetDomains) {
    const category = Object.entries(NEWS_CATEGORY_TO_DOMAIN)
      .find(([, d]) => d === domain)?.[0] as NewsCategory | undefined;
    
    if (category && NEWS_CATEGORIES.includes(category)) {
      categoriesToFetch.add(category);
    }
  }

  // Default to general if no matching categories
  if (categoriesToFetch.size === 0) {
    categoriesToFetch.add('general');
  }

  const results: NewsContent[] = [];
  const errors: string[] = [];

  // Fetch from each category
  for (const category of categoriesToFetch) {
    const response = await fetchNewsHeadlines(category, { pageSize });
    
    if (response.success && response.data) {
      results.push(...response.data);
    } else if (response.error) {
      errors.push(`${category}: ${response.error}`);
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.RATE_LIMITS.NEWS_API.DELAY_MS));
  }

  return {
    success: results.length > 0,
    data: results,
    error: errors.length > 0 ? errors.join('; ') : null,
    meta: {
      source: 'news',
      fetchedAt: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      cached: false,
    },
  };
}
