export const API_CONFIG = {
  NEWS_API: {
    BASE_URL: 'https://newsapi.org/v2',
    ENDPOINTS: {
      TOP_HEADLINES: '/top-headlines',
      EVERYTHING: '/everything',
    },
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },

  TMDB: {
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    ENDPOINTS: {
      TRENDING: '/trending',
      POPULAR_MOVIES: '/movie/popular',
      POPULAR_TV: '/tv/popular',
      SEARCH_MOVIE: '/search/movie',
      SEARCH_TV: '/search/tv',
      DISCOVER_MOVIE: '/discover/movie',
      DISCOVER_TV: '/discover/tv',
    },
    IMAGE_SIZES: {
      POSTER: 'w500',
      BACKDROP: 'w1280',
      PROFILE: 'w185',
      THUMBNAIL: 'w200',
    },
    DEFAULT_PAGE_SIZE: 20,
  },

  REDDIT: {
    BASE_URL: 'https://www.reddit.com',
    ENDPOINTS: {
      SUBREDDIT: '/r',
      SEARCH: '/search.json',
    },
    DEFAULT_LIMIT: 25,
    MAX_LIMIT: 100,
    SORT_OPTIONS: ['hot', 'new', 'top', 'rising'] as const,
    TIME_FILTERS: ['hour', 'day', 'week', 'month', 'year', 'all'] as const,
  },

  RATE_LIMITS: {
    NEWS_API: {
      REQUESTS_PER_DAY: 100,
      DELAY_MS: 1000,
    },
    TMDB: {
      REQUESTS_PER_SECOND: 40,
      DELAY_MS: 250,
    },
    REDDIT: {
      REQUESTS_PER_MINUTE: 60,
      DELAY_MS: 1000,
    },
  },

  DEFAULTS: {
    ITEMS_PER_PAGE: 20,
    MAX_RETRIES: 3,
    TIMEOUT_MS: 10000,
  },
} as const;

export const ENV_KEYS = {
  NEWS_API_KEY: 'NEXT_PUBLIC_NEWS_API_KEY',
  TMDB_API_KEY: 'NEXT_PUBLIC_TMDB_API_KEY',
} as const;

export function getApiKey(key: keyof typeof ENV_KEYS): string | null {
  let value: string | undefined;

  switch (key) {
    case 'NEWS_API_KEY':
      value = process.env.NEXT_PUBLIC_NEWS_API_KEY;
      break;
    case 'TMDB_API_KEY':
      value = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      break;
  }
  
  if (!value || value.trim() === '') {
    return null;
  }
  
  return value;
}
