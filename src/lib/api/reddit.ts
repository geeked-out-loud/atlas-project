import { API_CONFIG } from '@/config/api';
import { REDDIT_SUBREDDIT_TO_DOMAIN, DOMAIN_TO_SUBREDDITS, DOMAINS, type Domain } from '@/config/domains';
import type { RedditContent, ApiResponse } from '@/types/content';

interface RedditPost {
  kind: string;
  data: {
    id: string;
    name: string;
    title: string;
    selftext: string;
    selftext_html: string | null;
    author: string;
    author_fullname?: string;
    subreddit: string;
    subreddit_id: string;
    subreddit_name_prefixed: string;
    score: number;
    ups: number;
    downs: number;
    upvote_ratio: number;
    num_comments: number;
    created_utc: number;
    permalink: string;
    url: string;
    domain: string;
    thumbnail: string;
    preview?: {
      images: Array<{
        source: {
          url: string;
          width: number;
          height: number;
        };
        resolutions: Array<{
          url: string;
          width: number;
          height: number;
        }>;
      }>;
    };
    is_video: boolean;
    is_gallery?: boolean;
    media?: {
      reddit_video?: {
        fallback_url: string;
        height: number;
        width: number;
        duration: number;
      };
    };
    gallery_data?: {
      items: Array<{
        media_id: string;
        id: number;
      }>;
    };
    media_metadata?: Record<string, {
      s: { u: string; x: number; y: number };
    }>;
    over_18: boolean;
    spoiler: boolean;
    link_flair_text: string | null;
    post_hint?: string;
    is_self: boolean;
    stickied: boolean;
    locked: boolean;
    archived: boolean;
  };
}

interface RedditListingResponse {
  kind: string;
  data: {
    after: string | null;
    before: string | null;
    children: RedditPost[];
    dist: number;
    modhash: string;
  };
}

// Determine post type
function getPostType(post: RedditPost['data']): RedditContent['postType'] {
  if (post.is_self) return 'text';
  if (post.is_video) return 'video';
  if (post.is_gallery) return 'gallery';
  if (post.post_hint === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) return 'image';
  return 'link';
}

// Extract best image from post
function extractImage(post: RedditPost['data']): string | null {
  // Try preview images first
  if (post.preview?.images?.[0]) {
    const source = post.preview.images[0].source;
    // Decode HTML entities in URL
    return source.url.replace(/&amp;/g, '&');
  }
  
  // Try thumbnail (but not default thumbnails)
  if (post.thumbnail && !['self', 'default', 'nsfw', 'spoiler', ''].includes(post.thumbnail)) {
    return post.thumbnail;
  }
  
  // For image posts, use the URL directly
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) {
    return post.url;
  }
  
  return null;
}

// Extract all images for gallery posts
function extractGalleryImages(post: RedditPost['data']): string[] {
  if (!post.is_gallery || !post.media_metadata) return [];
  
  const images: string[] = [];
  const items = post.gallery_data?.items || [];
  
  for (const item of items) {
    const media = post.media_metadata[item.media_id];
    if (media?.s?.u) {
      images.push(media.s.u.replace(/&amp;/g, '&'));
    }
  }
  
  return images;
}

// Transform Reddit post to unified content
function transformPost(post: RedditPost, subreddit: string): RedditContent {
  const postData = post.data;
  const now = new Date().toISOString();
  
  // Get domain from subreddit mapping
  const domain = REDDIT_SUBREDDIT_TO_DOMAIN[subreddit.toLowerCase()] || DOMAINS.DISCUSSION;
  
  const image = extractImage(postData);
  const galleryImages = extractGalleryImages(postData);
  const allImages = galleryImages.length > 0 ? galleryImages : (image ? [image] : []);
  
  return {
    id: `reddit:${postData.id}`,
    source: 'reddit',
    sourceId: postData.id,
    sourceName: 'Reddit',
    sourceUrl: `https://www.reddit.com${postData.permalink}`,
    
    domains: [domain],
    primaryDomain: domain,
    
    title: postData.title,
    description: postData.selftext?.slice(0, 300) || null,
    content: postData.selftext || null,
    
    thumbnail: image,
    image: image,
    images: allImages,
    
    author: postData.author,
    publishedAt: new Date(postData.created_utc * 1000).toISOString(),
    fetchedAt: now,
    
    // Reddit-specific
    subreddit: postData.subreddit,
    subredditId: postData.subreddit_id,
    upvotes: postData.ups,
    downvotes: postData.downs,
    upvoteRatio: postData.upvote_ratio,
    isNsfw: postData.over_18,
    isSpoiler: postData.spoiler,
    flair: postData.link_flair_text,
    postType: getPostType(postData),
    permalink: postData.permalink,
    
    score: postData.score,
    comments: postData.num_comments,
    shares: null,
    
    viewCount: 0,
    isFavorite: false,
    isRead: false,
    
    _raw: postData,
  };
}

// Fetch posts from a subreddit
export async function fetchSubreddit(
  subreddit: string,
  options: {
    sort?: 'hot' | 'new' | 'top' | 'rising';
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
    after?: string;
  } = {}
): Promise<ApiResponse<RedditContent[]>> {
  const startTime = Date.now();
  const { sort = 'hot', time = 'day', limit = API_CONFIG.REDDIT.DEFAULT_LIMIT, after } = options;
  
  const params = new URLSearchParams({
    limit: String(limit),
    raw_json: '1', // Get unescaped JSON
  });
  
  if (sort === 'top') {
    params.append('t', time);
  }
  if (after) {
    params.append('after', after);
  }

  try {
    const response = await fetch(
      `${API_CONFIG.REDDIT.BASE_URL}/r/${subreddit}/${sort}.json?${params}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Subreddit r/${subreddit} not found`);
      }
      if (response.status === 403) {
        throw new Error(`Subreddit r/${subreddit} is private or quarantined`);
      }
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data: RedditListingResponse = await response.json();

    const posts = data.data.children
      .filter(post => !post.data.stickied) // Skip stickied posts
      .filter(post => !post.data.over_18) // Skip NSFW for now
      .map(post => transformPost(post, subreddit));

    return {
      success: true,
      data: posts,
      error: null,
      meta: {
        source: 'reddit',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Reddit API Error (r/${subreddit}):`, errorMessage);
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      meta: {
        source: 'reddit',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }
}

// Fetch from multiple subreddits
export async function fetchMultipleSubreddits(
  subreddits: string[],
  options: {
    sort?: 'hot' | 'new' | 'top' | 'rising';
    limit?: number;
  } = {}
): Promise<ApiResponse<RedditContent[]>> {
  const startTime = Date.now();
  const { limit = 10 } = options;
  
  const results: RedditContent[] = [];
  const errors: string[] = [];

  // Fetch from each subreddit with rate limiting
  for (const subreddit of subreddits) {
    const response = await fetchSubreddit(subreddit, { ...options, limit });
    
    if (response.success && response.data) {
      results.push(...response.data);
    } else if (response.error) {
      errors.push(`r/${subreddit}: ${response.error}`);
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.RATE_LIMITS.REDDIT.DELAY_MS));
  }

  return {
    success: results.length > 0,
    data: results,
    error: errors.length > 0 ? errors.join('; ') : null,
    meta: {
      source: 'reddit',
      fetchedAt: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      cached: false,
    },
  };
}

// Search Reddit
export async function searchReddit(
  query: string,
  options: {
    sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
    subreddit?: string; // Restrict to specific subreddit
  } = {}
): Promise<ApiResponse<RedditContent[]>> {
  const startTime = Date.now();
  const { sort = 'relevance', time = 'week', limit = 25, subreddit } = options;
  
  const params = new URLSearchParams({
    q: query,
    sort,
    t: time,
    limit: String(limit),
    raw_json: '1',
    type: 'link', // Only posts, not comments/subreddits
  });

  const baseUrl = subreddit 
    ? `${API_CONFIG.REDDIT.BASE_URL}/r/${subreddit}/search.json`
    : `${API_CONFIG.REDDIT.BASE_URL}/search.json`;

  try {
    const response = await fetch(`${baseUrl}?${params}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Reddit search error: ${response.status}`);
    }

    const data: RedditListingResponse = await response.json();

    const posts = data.data.children
      .filter(post => !post.data.over_18)
      .map(post => transformPost(post, post.data.subreddit));

    return {
      success: true,
      data: posts,
      error: null,
      meta: {
        source: 'reddit',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Reddit Search Error:', errorMessage);
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      meta: {
        source: 'reddit',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }
}

// Fetch Reddit posts by domains (for personalized feed)
export async function fetchRedditByDomains(
  targetDomains: Domain[],
  options: { limit?: number; sort?: 'hot' | 'new' | 'top' } = {}
): Promise<ApiResponse<RedditContent[]>> {
  const startTime = Date.now();
  const { limit = 5 } = options;
  
  // Collect subreddits for target domains
  const subredditsToFetch = new Set<string>();
  
  for (const domain of targetDomains) {
    const subreddits = DOMAIN_TO_SUBREDDITS[domain];
    if (subreddits) {
      // Take first 2 subreddits per domain to avoid too many requests
      subreddits.slice(0, 2).forEach(sub => subredditsToFetch.add(sub));
    }
  }

  // Default subreddits if no matching domains
  if (subredditsToFetch.size === 0) {
    ['technology', 'programming', 'movies'].forEach(sub => subredditsToFetch.add(sub));
  }

  const response = await fetchMultipleSubreddits(
    Array.from(subredditsToFetch).slice(0, 6), // Limit to 6 subreddits
    { ...options, limit }
  );

  return {
    ...response,
    meta: {
      ...response.meta,
      requestDuration: Date.now() - startTime,
    },
  };
}

// Get trending/popular posts across Reddit
export async function fetchTrendingReddit(
  options: { limit?: number } = {}
): Promise<ApiResponse<RedditContent[]>> {
  const startTime = Date.now();
  const { limit = 25 } = options;
  
  try {
    const response = await fetch(
      `${API_CONFIG.REDDIT.BASE_URL}/r/popular/hot.json?limit=${limit}&raw_json=1`,
      {
        headers: { 'User-Agent': 'Atlas Dashboard/1.0' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data: RedditListingResponse = await response.json();

    const posts = data.data.children
      .filter(post => !post.data.over_18)
      .map(post => transformPost(post, post.data.subreddit));

    return {
      success: true,
      data: posts,
      error: null,
      meta: {
        source: 'reddit',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Reddit Trending Error:', errorMessage);
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      meta: {
        source: 'reddit',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }
}
