import type { Domain } from '@/config/domains';
import { DEFAULT_DOMAINS, DOMAINS, DOMAIN_META } from '@/config/domains';
import type { ContentSource, UnifiedContent } from '@/types/content';

const STORAGE_KEYS = {
  PREFERENCES: 'atlas_preferences',
  HISTORY: 'atlas_history',
  FAVORITES: 'atlas_favorites',
} as const;

export interface UserPreferences {
  domains: Domain[];
  excludedDomains: Domain[];
  
  enabledSources: ContentSource[];
  
  showNsfw: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  autoPlayVideos: boolean;
  
  defaultSort: 'date' | 'score' | 'relevance';
  pageSize: number;
  
  trackHistory: boolean;
  autoLearnPreferences: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  contentId: string;
  source: ContentSource;
  domains: Domain[];
  viewedAt: string;
  engagementType: 'view' | 'click' | 'favorite' | 'share';
  timeSpent?: number; // milliseconds
}

// Domain engagement stats
export interface DomainEngagement {
  domain: Domain;
  views: number;
  clicks: number;
  favorites: number;
  lastEngaged: string;
  score: number; // Calculated engagement score
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  domains: DEFAULT_DOMAINS,
  excludedDomains: [],
  enabledSources: ['news', 'tmdb', 'reddit'],
  showNsfw: false,
  imageQuality: 'high',
  autoPlayVideos: false,
  defaultSort: 'date',
  pageSize: 20,
  trackHistory: true,
  autoLearnPreferences: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Check if running in browser
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// Get preferences from storage
export function getPreferences(): UserPreferences {
  if (!isBrowser()) return DEFAULT_PREFERENCES;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!stored) return DEFAULT_PREFERENCES;
    
    const parsed = JSON.parse(stored);
    // Merge with defaults to handle new preference fields
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

// Save preferences to storage
export function savePreferences(preferences: Partial<UserPreferences>): UserPreferences {
  if (!isBrowser()) return { ...DEFAULT_PREFERENCES, ...preferences };
  
  try {
    const current = getPreferences();
    const updated: UserPreferences = {
      ...current,
      ...preferences,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return getPreferences();
  }
}

// Reset preferences to defaults
export function resetPreferences(): UserPreferences {
  if (!isBrowser()) return DEFAULT_PREFERENCES;
  
  const fresh = {
    ...DEFAULT_PREFERENCES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(fresh));
  return fresh;
}

// Get history from storage
export function getHistory(limit?: number): HistoryEntry[] {
  if (!isBrowser()) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!stored) return [];
    
    const history: HistoryEntry[] = JSON.parse(stored);
    
    if (limit) {
      return history.slice(0, limit);
    }
    return history;
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

// Add entry to history
export function addToHistory(entry: Omit<HistoryEntry, 'viewedAt'>): void {
  if (!isBrowser()) return;
  
  const preferences = getPreferences();
  if (!preferences.trackHistory) return;
  
  try {
    const history = getHistory();
    
    const newEntry: HistoryEntry = {
      ...entry,
      viewedAt: new Date().toISOString(),
    };
    
    // Remove duplicate if exists
    const filtered = history.filter(h => h.contentId !== entry.contentId);
    
    // Add to beginning and limit to 1000 entries
    const updated = [newEntry, ...filtered].slice(0, 1000);
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to add to history:', error);
  }
}

// Clear history
export function clearHistory(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

// Track content view (simplified entry point)
export function trackContentView(content: UnifiedContent): void {
  addToHistory({
    contentId: content.id,
    source: content.source,
    domains: content.domains,
    engagementType: 'view',
  });
}

// Track content click
export function trackContentClick(content: UnifiedContent): void {
  addToHistory({
    contentId: content.id,
    source: content.source,
    domains: content.domains,
    engagementType: 'click',
  });
}

// Get domain engagement statistics
export function getDomainEngagement(): DomainEngagement[] {
  const history = getHistory();
  const engagementMap: Record<string, DomainEngagement> = {};
  
  // Initialize with all domains
  for (const domain of Object.values(DOMAINS)) {
    engagementMap[domain] = {
      domain,
      views: 0,
      clicks: 0,
      favorites: 0,
      lastEngaged: '',
      score: 0,
    };
  }
  
  // Calculate engagement from history
  for (const entry of history) {
    for (const domain of entry.domains) {
      if (engagementMap[domain]) {
        if (entry.engagementType === 'view') {
          engagementMap[domain].views++;
        } else if (entry.engagementType === 'click') {
          engagementMap[domain].clicks++;
        } else if (entry.engagementType === 'favorite') {
          engagementMap[domain].favorites++;
        }
        
        if (!engagementMap[domain].lastEngaged || 
            entry.viewedAt > engagementMap[domain].lastEngaged) {
          engagementMap[domain].lastEngaged = entry.viewedAt;
        }
      }
    }
  }
  
  // Calculate engagement score
  for (const engagement of Object.values(engagementMap)) {
    // Score formula: views * 1 + clicks * 3 + favorites * 5
    engagement.score = engagement.views + (engagement.clicks * 3) + (engagement.favorites * 5);
  }
  
  // Sort by score descending
  return Object.values(engagementMap).sort((a, b) => b.score - a.score);
}

// Get recommended domains based on history
export function getRecommendedDomains(limit: number = 5): Domain[] {
  const engagement = getDomainEngagement();
  
  // Filter domains with some engagement
  const engaged = engagement.filter(e => e.score > 0);
  
  // If not enough history, return defaults
  if (engaged.length < 3) {
    return DEFAULT_DOMAINS.slice(0, limit);
  }
  
  return engaged.slice(0, limit).map(e => e.domain);
}

// Learn and update preferences from history
export function learnFromHistory(): void {
  const preferences = getPreferences();
  if (!preferences.autoLearnPreferences) return;
  
  const recommended = getRecommendedDomains(10);
  
  // Only update if we have enough data
  if (recommended.length >= 3) {
    savePreferences({
      domains: recommended,
    });
  }
}

// Get favorites from storage
export function getFavorites(): string[] {
  if (!isBrowser()) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

// Add to favorites
export function addToFavorites(contentId: string, content?: UnifiedContent): void {
  if (!isBrowser()) return;
  
  const favorites = getFavorites();
  if (!favorites.includes(contentId)) {
    favorites.unshift(contentId);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites.slice(0, 500)));
    
    // Track in history
    if (content) {
      addToHistory({
        contentId,
        source: content.source,
        domains: content.domains,
        engagementType: 'favorite',
      });
    }
  }
}

// Remove from favorites
export function removeFromFavorites(contentId: string): void {
  if (!isBrowser()) return;
  
  const favorites = getFavorites();
  const filtered = favorites.filter(id => id !== contentId);
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
}

// Check if favorited
export function isFavorited(contentId: string): boolean {
  return getFavorites().includes(contentId);
}

// Toggle favorite
export function toggleFavorite(contentId: string, content?: UnifiedContent): boolean {
  if (isFavorited(contentId)) {
    removeFromFavorites(contentId);
    return false;
  } else {
    addToFavorites(contentId, content);
    return true;
  }
}

// Export domain info helper
export function getAllDomains() {
  return Object.values(DOMAINS).map(domain => ({
    id: domain,
    ...DOMAIN_META[domain],
  }));
}
