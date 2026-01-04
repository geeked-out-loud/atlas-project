'use client';

import { Search, Moon, Sun, User, ChevronDown, LogOut, AtSign } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';import Image from 'next/image';
export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Image 
              src="/logo.png" 
              alt="Atlas" 
              width={48} 
              height={48}
              className="h-12 w-12 dark:invert"
              priority
            />
          </div>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search
                size={18}
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                  searchFocused ? 'text-rose-500' : 'text-gray-500'
                }`}
              />
              <input
                type="text"
                placeholder="Search..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-950 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none border border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
              aria-label="Toggle theme"
            >
              {!mounted ? (
                <div className="w-5 h-5" />
              ) : theme === 'dark' ? (
                <Sun size={20} className="text-rose-500" />
              ) : (
                <Moon size={20} className="text-gray-900" />
              )}
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-700 dark:text-gray-300 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-rose-500 to-rose-600 flex items-center justify-center shrink-0">
                        <User size={24} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-950 dark:text-gray-50">
                          Guest User
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          guest@atlas.app
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Handle account navigation
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left"
                    >
                      <AtSign size={18} className="text-gray-700 dark:text-gray-300" />
                      <span className="text-gray-950 dark:text-gray-50">Account</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Handle logout
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-left"
                    >
                      <LogOut size={18} className="text-gray-700 dark:text-gray-300" />
                      <span className="text-gray-950 dark:text-gray-50">Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
