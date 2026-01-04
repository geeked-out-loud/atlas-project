'use client';

import { useTheme as useNextTheme } from 'next-themes';

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };
  
  return {
    theme: resolvedTheme as 'light' | 'dark' | undefined,
    setTheme,
    toggleTheme,
  };
}
