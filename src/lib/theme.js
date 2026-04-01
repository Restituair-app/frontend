const THEME_STORAGE_KEY = 'restitua_theme';

const isBrowser = () => typeof window !== 'undefined';

export const getSystemTheme = () => {
  if (!isBrowser()) {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const resolveTheme = (preference) => {
  if (preference === 'dark' || preference === 'light') {
    return preference;
  }

  return getSystemTheme();
};

export const getThemePreference = () => {
  if (!isBrowser()) {
    return 'system';
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'light' || saved === 'system') {
    return saved;
  }

  return 'system';
};

export const applyThemePreference = (preference) => {
  if (!isBrowser()) {
    return 'light';
  }

  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  return resolved;
};

export const setThemePreference = (preference) => {
  if (!isBrowser()) {
    return 'light';
  }

  const normalized =
    preference === 'dark' || preference === 'light' || preference === 'system'
      ? preference
      : 'system';

  window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
  return applyThemePreference(normalized);
};

