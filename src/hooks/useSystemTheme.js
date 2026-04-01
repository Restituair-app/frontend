import { useEffect } from 'react';
import { applyThemePreference, getThemePreference } from '@/lib/theme';

/**
 * Detects the OS color scheme preference and dynamically applies/removes
 * the 'dark' Tailwind class on the root <html> element.
 */
export default function useSystemTheme() {
  useEffect(() => {
    const preference = getThemePreference();
    applyThemePreference(preference);

    if (preference !== 'system') {
      return undefined;
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (getThemePreference() === 'system') {
        applyThemePreference('system');
      }
    };

    mq.addEventListener('change', handler);

    return () => mq.removeEventListener('change', handler);
  }, []);
}
