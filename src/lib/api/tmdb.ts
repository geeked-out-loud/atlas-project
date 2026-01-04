import { API_CONFIG, getApiKey } from '@/config/api';
import { TMDB_GENRE_TO_DOMAIN, DOMAINS, type Domain } from '@/config/domains';
import type { TMDBContent, ApiResponse } from '@/types/content';

interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  video: boolean;
}

interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
}

interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

const GENRE_NAMES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV-specific genres
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

// Build image URL
export function getImageUrl(path: string | null, size: keyof typeof API_CONFIG.TMDB.IMAGE_SIZES = 'POSTER'): string | null {
  if (!path) return null;
  return `${API_CONFIG.TMDB.IMAGE_BASE_URL}/${API_CONFIG.TMDB.IMAGE_SIZES[size]}${path}`;
}

// Get domains from genre IDs
function getDomainsFromGenres(genreIds: number[]): Domain[] {
  const domains = new Set<Domain>();
  
  for (const genreId of genreIds) {
    const domain = TMDB_GENRE_TO_DOMAIN[genreId];
    if (domain) {
      domains.add(domain);
    }
  }
  
  // Default to MOVIES or ENTERTAINMENT if no specific mapping
  if (domains.size === 0) {
    domains.add(DOMAINS.MOVIES);
  }
  
  return Array.from(domains);
}

// Transform movie to unified content
function transformMovie(movie: TMDBMovie): TMDBContent {
  const domains = getDomainsFromGenres(movie.genre_ids);
  const now = new Date().toISOString();
  
  return {
    id: `tmdb:movie:${movie.id}`,
    source: 'tmdb',
    sourceId: String(movie.id),
    sourceName: 'TMDB',
    sourceUrl: `https://www.themoviedb.org/movie/${movie.id}`,
    
    domains,
    primaryDomain: domains[0],
    
    title: movie.title,
    description: movie.overview || null,
    content: movie.overview || null,
    
    thumbnail: getImageUrl(movie.poster_path, 'THUMBNAIL'),
    image: getImageUrl(movie.poster_path, 'POSTER'),
    images: [
      getImageUrl(movie.poster_path, 'POSTER'),
      getImageUrl(movie.backdrop_path, 'BACKDROP'),
    ].filter(Boolean) as string[],
    backdropImage: getImageUrl(movie.backdrop_path, 'BACKDROP'),
    
    author: null,
    publishedAt: movie.release_date ? `${movie.release_date}T00:00:00Z` : now,
    fetchedAt: now,
    
    // TMDB-specific
    mediaType: 'movie',
    rating: movie.vote_average,
    releaseDate: movie.release_date || '',
    genres: movie.genre_ids,
    genreNames: movie.genre_ids.map(id => GENRE_NAMES[id] || 'Unknown'),
    popularity: movie.popularity,
    voteCount: movie.vote_count,
    
    score: Math.round(movie.vote_average * 10),
    comments: null,
    shares: null,
    
    viewCount: 0,
    isFavorite: false,
    isRead: false,
    
    _raw: movie,
  };
}

// Transform TV show to unified content
function transformTVShow(show: TMDBTVShow): TMDBContent {
  const domains = getDomainsFromGenres(show.genre_ids);
  if (!domains.includes(DOMAINS.TV_SHOWS)) {
    domains.unshift(DOMAINS.TV_SHOWS);
  }
  const now = new Date().toISOString();
  
  return {
    id: `tmdb:tv:${show.id}`,
    source: 'tmdb',
    sourceId: String(show.id),
    sourceName: 'TMDB',
    sourceUrl: `https://www.themoviedb.org/tv/${show.id}`,
    
    domains,
    primaryDomain: DOMAINS.TV_SHOWS,
    
    title: show.name,
    description: show.overview || null,
    content: show.overview || null,
    
    thumbnail: getImageUrl(show.poster_path, 'THUMBNAIL'),
    image: getImageUrl(show.poster_path, 'POSTER'),
    images: [
      getImageUrl(show.poster_path, 'POSTER'),
      getImageUrl(show.backdrop_path, 'BACKDROP'),
    ].filter(Boolean) as string[],
    backdropImage: getImageUrl(show.backdrop_path, 'BACKDROP'),
    
    author: null,
    publishedAt: show.first_air_date ? `${show.first_air_date}T00:00:00Z` : now,
    fetchedAt: now,
    
    mediaType: 'tv',
    rating: show.vote_average,
    releaseDate: show.first_air_date || '',
    genres: show.genre_ids,
    genreNames: show.genre_ids.map(id => GENRE_NAMES[id] || 'Unknown'),
    popularity: show.popularity,
    voteCount: show.vote_count,
    
    score: Math.round(show.vote_average * 10),
    comments: null,
    shares: null,
    
    viewCount: 0,
    isFavorite: false,
    isRead: false,
    
    _raw: show,
  };
}

// Fetch trending movies/TV
export async function fetchTrending(
  mediaType: 'movie' | 'tv' | 'all' = 'all',
  timeWindow: 'day' | 'week' = 'week',
  options: { page?: number } = {}
): Promise<ApiResponse<TMDBContent[]>> {
  const startTime = Date.now();
  const apiKey = getApiKey('TMDB_API_KEY');
  
  if (!apiKey) {
    console.warn('⚠️ TMDB API: API key not configured');
    return {
      success: false,
      data: null,
      error: 'TMDB_API_KEY not configured. Get one at https://www.themoviedb.org/settings/api',
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }

  const { page = 1 } = options;
  
  try {
    const response = await fetch(
      `${API_CONFIG.TMDB.BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${apiKey}&page=${page}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data: TMDBResponse<TMDBMovie & TMDBTVShow & { media_type?: string }> = await response.json();

    const items = data.results.map(item => {
      const type = item.media_type || mediaType;
      if (type === 'tv' || item.name) {
        return transformTVShow(item as TMDBTVShow);
      }
      return transformMovie(item as TMDBMovie);
    });

    return {
      success: true,
      data: items,
      error: null,
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ TMDB API Error:', errorMessage);
    
    return {
      success: false,
      data: null,
      error: errorMessage,
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }
}

// Fetch popular movies
export async function fetchPopularMovies(options: { page?: number } = {}): Promise<ApiResponse<TMDBContent[]>> {
  const startTime = Date.now();
  const apiKey = getApiKey('TMDB_API_KEY');
  
  if (!apiKey) {
    return {
      success: false,
      data: null,
      error: 'TMDB_API_KEY not configured',
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }

  const { page = 1 } = options;
  
  try {
    const response = await fetch(
      `${API_CONFIG.TMDB.BASE_URL}/movie/popular?api_key=${apiKey}&page=${page}`,
      { next: { revalidate: 3600 } }
    );

    const data: TMDBResponse<TMDBMovie> = await response.json();
    const items = data.results.map(transformMovie);

    return {
      success: true,
      data: items,
      error: null,
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      data: null,
      error: errorMessage,
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }
}

// Fetch popular TV shows
export async function fetchPopularTV(options: { page?: number } = {}): Promise<ApiResponse<TMDBContent[]>> {
  const startTime = Date.now();
  const apiKey = getApiKey('TMDB_API_KEY');
  
  if (!apiKey) {
    return {
      success: false,
      data: null,
      error: 'TMDB_API_KEY not configured',
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }

  const { page = 1 } = options;
  
  try {
    const response = await fetch(
      `${API_CONFIG.TMDB.BASE_URL}/tv/popular?api_key=${apiKey}&page=${page}`,
      { next: { revalidate: 3600 } }
    );

    const data: TMDBResponse<TMDBTVShow> = await response.json();
    const items = data.results.map(transformTVShow);

    return {
      success: true,
      data: items,
      error: null,
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      data: null,
      error: errorMessage,
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }
}

// Search movies
export async function searchMovies(
  query: string,
  options: { page?: number; year?: number } = {}
): Promise<ApiResponse<TMDBContent[]>> {
  const startTime = Date.now();
  const apiKey = getApiKey('TMDB_API_KEY');
  
  if (!apiKey) {
    return {
      success: false,
      data: null,
      error: 'TMDB_API_KEY not configured',
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }

  const { page = 1, year } = options;
  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    page: String(page),
  });
  if (year) params.append('year', String(year));

  try {
    const response = await fetch(
      `${API_CONFIG.TMDB.BASE_URL}/search/movie?${params}`,
      { next: { revalidate: 300 } }
    );

    const data: TMDBResponse<TMDBMovie> = await response.json();
    const items = data.results.map(transformMovie);

    return {
      success: true,
      data: items,
      error: null,
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      data: null,
      error: errorMessage,
      meta: {
        source: 'tmdb',
        fetchedAt: new Date().toISOString(),
        requestDuration: Date.now() - startTime,
        cached: false,
      },
    };
  }
}

// Fetch by domains (for personalized feed)
export async function fetchTMDBByDomains(
  targetDomains: Domain[],
  options: { page?: number } = {}
): Promise<ApiResponse<TMDBContent[]>> {
  const startTime = Date.now();
  const results: TMDBContent[] = [];
  const errors: string[] = [];

  // Check if user wants movies
  const movieDomains: Domain[] = [DOMAINS.MOVIES, DOMAINS.ENTERTAINMENT, DOMAINS.SCIENCE];
  const wantsMovies = targetDomains.some(d => movieDomains.includes(d));
  
  // Check if user wants TV
  const tvDomains: Domain[] = [DOMAINS.TV_SHOWS, DOMAINS.ENTERTAINMENT, DOMAINS.ANIME];
  const wantsTV = targetDomains.some(d => tvDomains.includes(d));

  if (wantsMovies || (!wantsMovies && !wantsTV)) {
    const movieResponse = await fetchTrending('movie', 'week', options);
    if (movieResponse.success && movieResponse.data) {
      results.push(...movieResponse.data);
    } else if (movieResponse.error) {
      errors.push(movieResponse.error);
    }
  }

  if (wantsTV) {
    const tvResponse = await fetchTrending('tv', 'week', options);
    if (tvResponse.success && tvResponse.data) {
      results.push(...tvResponse.data);
    } else if (tvResponse.error) {
      errors.push(tvResponse.error);
    }
  }

  return {
    success: results.length > 0,
    data: results,
    error: errors.length > 0 ? errors.join('; ') : null,
    meta: {
      source: 'tmdb',
      fetchedAt: new Date().toISOString(),
      requestDuration: Date.now() - startTime,
      cached: false,
    },
  };
}
