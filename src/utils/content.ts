import type { UnifiedContent, ContentSource } from '@/types/content';
import type { Domain } from '@/config/domains';
import { DOMAIN_META } from '@/config/domains';

export function deduplicateContent(content: UnifiedContent[]): UnifiedContent[] {
  const seen = new Set<string>();
  return content.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function filterByDomains(content: UnifiedContent[], domains: Domain[]): UnifiedContent[] {
  if (domains.length === 0) return content;
  
  return content.filter(item => 
    item.domains.some(d => domains.includes(d))
  );
}

export function filterBySource(content: UnifiedContent[], sources: ContentSource[]): UnifiedContent[] {
  if (sources.length === 0) return content;
  return content.filter(item => sources.includes(item.source));
}

export function getContentStats(content: UnifiedContent[]): {
  total: number;
  bySource: Record<ContentSource, number>;
  byDomain: Record<string, number>;
  withImages: number;
  avgScore: number;
} {
  const bySource: Record<ContentSource, number> = { news: 0, tmdb: 0, reddit: 0 };
  const byDomain: Record<string, number> = {};
  let withImages = 0;
  let totalScore = 0;
  let scoreCount = 0;

  for (const item of content) {
    bySource[item.source]++;
    
    for (const domain of item.domains) {
      byDomain[domain] = (byDomain[domain] || 0) + 1;
    }
    
    if (item.image || item.thumbnail) {
      withImages++;
    }
    
    if (item.score !== null) {
      totalScore += item.score;
      scoreCount++;
    }
  }

  return {
    total: content.length,
    bySource,
    byDomain,
    withImages,
    avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
  };
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

// Format score for display
export function formatScore(score: number | null): string {
  if (score === null) return '-';
  if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
  return String(score);
}

// Get domain display info
export function getDomainInfo(domain: Domain) {
  return DOMAIN_META[domain] || { label: domain, icon: 'Tag', color: '#6b7280' };
}

// Group content by domain
export function groupByDomain(content: UnifiedContent[]): Record<Domain, UnifiedContent[]> {
  const grouped: Record<string, UnifiedContent[]> = {};
  
  for (const item of content) {
    const domain = item.primaryDomain;
    if (!grouped[domain]) {
      grouped[domain] = [];
    }
    grouped[domain].push(item);
  }
  
  return grouped as Record<Domain, UnifiedContent[]>;
}

// Group content by source
export function groupBySource(content: UnifiedContent[]): Record<ContentSource, UnifiedContent[]> {
  const grouped: Record<ContentSource, UnifiedContent[]> = {
    news: [],
    tmdb: [],
    reddit: [],
  };
  
  for (const item of content) {
    grouped[item.source].push(item);
  }
  
  return grouped;
}

// Extract unique domains from content
export function extractDomains(content: UnifiedContent[]): Domain[] {
  const domains = new Set<Domain>();
  
  for (const item of content) {
    for (const domain of item.domains) {
      domains.add(domain);
    }
  }
  
  return Array.from(domains);
}

// Check if content has valid media
export function hasValidMedia(item: UnifiedContent): boolean {
  return Boolean(
    item.image || 
    item.thumbnail || 
    (item.images && item.images.length > 0)
  );
}

// Get best image URL from content
export function getBestImage(item: UnifiedContent): string | null {
  return item.image || item.thumbnail || item.images?.[0] || null;
}

// Truncate text with ellipsis
export function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Create content excerpt
export function createExcerpt(item: UnifiedContent, maxLength: number = 150): string {
  const text = item.description || item.content || item.title;
  return truncateText(text, maxLength);
}
