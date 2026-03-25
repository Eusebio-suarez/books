import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'books-theme-mode';

function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null;
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (getStoredTheme()) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function handleChange(event: MediaQueryListEvent): void {
      setTheme(event.matches ? 'dark' : 'light');
    }

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  function toggleTheme(): void {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  }

  return {
    theme,
    toggleTheme,
  };
}
