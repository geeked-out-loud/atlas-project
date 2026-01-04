export const DOMAINS = {
  // News & Information
  TECHNOLOGY: 'technology',
  SCIENCE: 'science',
  BUSINESS: 'business',
  FINANCE: 'finance',
  POLITICS: 'politics',
  WORLD: 'world',
  HEALTH: 'health',
  
  // Entertainment
  ENTERTAINMENT: 'entertainment',
  MOVIES: 'movies',
  TV_SHOWS: 'tv_shows',
  MUSIC: 'music',
  GAMING: 'gaming',
  ANIME: 'anime',
  
  // Lifestyle
  SPORTS: 'sports',
  FOOD: 'food',
  TRAVEL: 'travel',
  FASHION: 'fashion',
  ART: 'art',
  
  // Learning & Discussion
  PROGRAMMING: 'programming',
  DESIGN: 'design',
  EDUCATION: 'education',
  DISCUSSION: 'discussion',
} as const;

export type Domain = typeof DOMAINS[keyof typeof DOMAINS];

export const DOMAIN_META: Record<Domain, { label: string; icon: string; color: string }> = {
  [DOMAINS.TECHNOLOGY]: { label: 'Technology', icon: 'Cpu', color: '#3b82f6' },
  [DOMAINS.SCIENCE]: { label: 'Science', icon: 'Flask', color: '#8b5cf6' },
  [DOMAINS.BUSINESS]: { label: 'Business', icon: 'Briefcase', color: '#6366f1' },
  [DOMAINS.FINANCE]: { label: 'Finance', icon: 'DollarSign', color: '#10b981' },
  [DOMAINS.POLITICS]: { label: 'Politics', icon: 'Landmark', color: '#ef4444' },
  [DOMAINS.WORLD]: { label: 'World', icon: 'Globe', color: '#0ea5e9' },
  [DOMAINS.HEALTH]: { label: 'Health', icon: 'Heart', color: '#ec4899' },
  [DOMAINS.ENTERTAINMENT]: { label: 'Entertainment', icon: 'Sparkles', color: '#f59e0b' },
  [DOMAINS.MOVIES]: { label: 'Movies', icon: 'Film', color: '#f97316' },
  [DOMAINS.TV_SHOWS]: { label: 'TV Shows', icon: 'Tv', color: '#84cc16' },
  [DOMAINS.MUSIC]: { label: 'Music', icon: 'Music', color: '#a855f7' },
  [DOMAINS.GAMING]: { label: 'Gaming', icon: 'Gamepad2', color: '#22c55e' },
  [DOMAINS.ANIME]: { label: 'Anime', icon: 'Cherry', color: '#f43f5e' },
  [DOMAINS.SPORTS]: { label: 'Sports', icon: 'Trophy', color: '#eab308' },
  [DOMAINS.FOOD]: { label: 'Food', icon: 'UtensilsCrossed', color: '#f97316' },
  [DOMAINS.TRAVEL]: { label: 'Travel', icon: 'Plane', color: '#06b6d4' },
  [DOMAINS.FASHION]: { label: 'Fashion', icon: 'Shirt', color: '#d946ef' },
  [DOMAINS.ART]: { label: 'Art', icon: 'Palette', color: '#f472b6' },
  [DOMAINS.PROGRAMMING]: { label: 'Programming', icon: 'Code', color: '#14b8a6' },
  [DOMAINS.DESIGN]: { label: 'Design', icon: 'Figma', color: '#8b5cf6' },
  [DOMAINS.EDUCATION]: { label: 'Education', icon: 'GraduationCap', color: '#0284c7' },
  [DOMAINS.DISCUSSION]: { label: 'Discussion', icon: 'MessageCircle', color: '#64748b' },
};

export const DEFAULT_DOMAINS: Domain[] = [
  DOMAINS.TECHNOLOGY,
  DOMAINS.ENTERTAINMENT,
  DOMAINS.MOVIES,
  DOMAINS.SCIENCE,
  DOMAINS.GAMING,
];

export const NEWS_CATEGORY_TO_DOMAIN: Record<string, Domain> = {
  'technology': DOMAINS.TECHNOLOGY,
  'science': DOMAINS.SCIENCE,
  'business': DOMAINS.BUSINESS,
  'entertainment': DOMAINS.ENTERTAINMENT,
  'sports': DOMAINS.SPORTS,
  'health': DOMAINS.HEALTH,
  'general': DOMAINS.WORLD,
};

// TMDB genre to domain mapping
export const TMDB_GENRE_TO_DOMAIN: Record<number, Domain> = {
  28: DOMAINS.MOVIES,      // Action
  12: DOMAINS.MOVIES,      // Adventure
  16: DOMAINS.ANIME,       // Animation
  35: DOMAINS.ENTERTAINMENT, // Comedy
  80: DOMAINS.MOVIES,      // Crime
  99: DOMAINS.EDUCATION,   // Documentary
  18: DOMAINS.MOVIES,      // Drama
  10751: DOMAINS.ENTERTAINMENT, // Family
  14: DOMAINS.MOVIES,      // Fantasy
  36: DOMAINS.EDUCATION,   // History
  27: DOMAINS.MOVIES,      // Horror
  10402: DOMAINS.MUSIC,    // Music
  9648: DOMAINS.MOVIES,    // Mystery
  10749: DOMAINS.ENTERTAINMENT, // Romance
  878: DOMAINS.SCIENCE,    // Science Fiction
  10770: DOMAINS.TV_SHOWS, // TV Movie
  53: DOMAINS.MOVIES,      // Thriller
  10752: DOMAINS.MOVIES,   // War
  37: DOMAINS.MOVIES,      // Western
};

// Reddit subreddit to domain mapping
export const REDDIT_SUBREDDIT_TO_DOMAIN: Record<string, Domain> = {
  'technology': DOMAINS.TECHNOLOGY,
  'programming': DOMAINS.PROGRAMMING,
  'webdev': DOMAINS.PROGRAMMING,
  'javascript': DOMAINS.PROGRAMMING,
  'reactjs': DOMAINS.PROGRAMMING,
  'science': DOMAINS.SCIENCE,
  'movies': DOMAINS.MOVIES,
  'television': DOMAINS.TV_SHOWS,
  'gaming': DOMAINS.GAMING,
  'music': DOMAINS.MUSIC,
  'worldnews': DOMAINS.WORLD,
  'news': DOMAINS.WORLD,
  'sports': DOMAINS.SPORTS,
  'art': DOMAINS.ART,
  'design': DOMAINS.DESIGN,
  'food': DOMAINS.FOOD,
  'travel': DOMAINS.TRAVEL,
  'anime': DOMAINS.ANIME,
  'fitness': DOMAINS.HEALTH,
  'personalfinance': DOMAINS.FINANCE,
};

// Subreddits to fetch from by domain
export const DOMAIN_TO_SUBREDDITS: Record<Domain, string[]> = {
  [DOMAINS.TECHNOLOGY]: ['technology', 'tech', 'gadgets'],
  [DOMAINS.SCIENCE]: ['science', 'space', 'physics'],
  [DOMAINS.BUSINESS]: ['business', 'entrepreneur', 'startups'],
  [DOMAINS.FINANCE]: ['personalfinance', 'investing', 'stocks'],
  [DOMAINS.POLITICS]: ['politics', 'worldpolitics'],
  [DOMAINS.WORLD]: ['worldnews', 'news'],
  [DOMAINS.HEALTH]: ['health', 'fitness', 'nutrition'],
  [DOMAINS.ENTERTAINMENT]: ['entertainment', 'celebrities'],
  [DOMAINS.MOVIES]: ['movies', 'film', 'cinema'],
  [DOMAINS.TV_SHOWS]: ['television', 'tvshows'],
  [DOMAINS.MUSIC]: ['music', 'listentothis'],
  [DOMAINS.GAMING]: ['gaming', 'games', 'pcgaming'],
  [DOMAINS.ANIME]: ['anime', 'manga'],
  [DOMAINS.SPORTS]: ['sports', 'nba', 'soccer'],
  [DOMAINS.FOOD]: ['food', 'cooking', 'recipes'],
  [DOMAINS.TRAVEL]: ['travel', 'backpacking'],
  [DOMAINS.FASHION]: ['fashion', 'streetwear'],
  [DOMAINS.ART]: ['art', 'digitalart', 'illustration'],
  [DOMAINS.PROGRAMMING]: ['programming', 'webdev', 'javascript', 'reactjs'],
  [DOMAINS.DESIGN]: ['design', 'web_design', 'UI_Design'],
  [DOMAINS.EDUCATION]: ['education', 'learnprogramming'],
  [DOMAINS.DISCUSSION]: ['askreddit', 'todayilearned'],
};
