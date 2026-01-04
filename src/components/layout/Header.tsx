'use client';

import { Search, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-rose-500 to-rose-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="hidden sm:block font-semibold text-lg text-gray-950 dark:text-gray-50">
              Atlas
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div
              className={`relative transition-all duration-200 ${
                searchFocused
                  ? 'ring-2 ring-rose-500/30 rounded-full'
                  : ''
              }`}
            >
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-950 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none border border-gray-200 dark:border-gray-700 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun size={20} className="text-rose-500" />
              ) : (
                <Moon size={20} className="text-gray-900" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
