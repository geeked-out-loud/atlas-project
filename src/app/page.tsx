'use client';

import { useEffect, useState } from 'react';
import { fetchContentFeed, fetchTrendingFeed, fetchTrendingReddit } from '@/lib/api';
import { getContentStats, formatRelativeTime, getDomainInfo } from '@/utils/content';
import { getPreferences, getDomainEngagement, getAllDomains } from '@/utils/preferences';
import { DEFAULT_DOMAINS, DOMAINS } from '@/config/domains';
import type { UnifiedContent, ContentFeedResponse } from '@/types/content';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [feedData, setFeedData] = useState<ContentFeedResponse | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      
      console.log('\n🌐 Atlas Dashboard - Fetching Data\n');

      const preferences = getPreferences();
      console.log('� Preferences:', preferences.domains);
      
      const engagement = getDomainEngagement();
      console.log('📊 Engagement:', engagement.slice(0, 3));

      const feedResponse = await fetchContentFeed({
        domains: preferences.domains,
        pageSize: 30,
        sortBy: 'date',
      });
      
      setFeedData(feedResponse);
      
      console.log('📰 Feed:', feedResponse.total, 'items from', feedResponse.sources.length, 'sources');
      
      if (feedResponse.items.length > 0) {
        const stats = getContentStats(feedResponse.items);
        console.log('\n📈 Content Statistics:', stats);
        
        console.log('\n🔝 First 5 Items:');
        feedResponse.items.slice(0, 5).forEach((item, i) => {
          console.log(`${i + 1}. [${item.source}] ${item.title.slice(0, 50)}...`);
        });
      }

      const trendingResponse = await fetchTrendingFeed({ pageSize: 20 });
      
      console.log('✅ Trending Response:', trendingResponse);
      console.log(`📊 Total Trending Items: ${trendingResponse.total}`);
      
      if (trendingResponse.items.length > 0) {
        console.log('\n🔝 Top 5 Trending:');
        trendingResponse.items.slice(0, 5).forEach((item, i) => {
          console.log(`  ${i + 1}. [${item.source.toUpperCase()}] ${item.title.slice(0, 50)}...`);
          console.log(`     👍 Score: ${item.score ?? 'N/A'} | 🏷️ ${item.primaryDomain}`);
        });
      }
      
      console.log('\n');

      // ─────────────────────────────────────────────────────────────
      // 4. REDDIT SPECIFIC (Social Media Replacement)
      // ─────────────────────────────────────────────────────────────
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log('│ 🔴 REDDIT POSTS (Real Social Media Data)                    │');
      console.log('└─────────────────────────────────────────────────────────────┘');
      
      const redditResponse = await fetchTrendingReddit({ limit: 15 });
      
      console.log('✅ Reddit Response:', redditResponse);
      
      if (redditResponse.success && redditResponse.data) {
        console.log(`📊 Total Reddit Posts: ${redditResponse.data.length}`);
        console.log(`⏱️  Request Duration: ${redditResponse.meta.requestDuration}ms`);
        
        console.log('\n🔝 Top 5 Reddit Posts:');
        redditResponse.data.slice(0, 5).forEach((post, i) => {
          console.log(`  ${i + 1}. r/${post.subreddit}: ${post.title.slice(0, 50)}...`);
          console.log(`     👍 ${post.upvotes} upvotes | 💬 ${post.comments} comments`);
          console.log(`${i + 1}. [Reddit] ${post.title.slice(0, 50)}... (${post.upvotes} upvotes)`);
        });
      }

      console.log('\n✅ Data fetched successfully\n');
      
      setIsLoading(false);
    };

    fetchAllData();
  }, []);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-12">
      <div className="text-center space-y-6">
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {isLoading ? (
              <>Loading content from <span className="text-rose-500 font-semibold">News</span>, <span className="text-rose-500 font-semibold">TMDB</span>, and <span className="text-rose-500 font-semibold">Reddit</span>...</>
            ) : (
              <>Check your <span className="text-rose-500 font-semibold">console</span> to see {feedData?.total || 0} items fetched with domain tags and metadata.</>
            )}
          </p>
          
          {feedData && !isLoading && (
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
              {feedData.sources.map((source) => (
                <div key={source.source} className="p-4 rounded-xl bg-gray-100 dark:bg-gray-900">
                  <p className="text-2xl font-bold text-rose-500">{source.count}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{source.source}</p>
                  {source.error && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Error</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
