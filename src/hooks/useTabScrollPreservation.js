import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Saves and restores the window scroll position for each route path,
 * so switching between bottom-nav tabs doesn't reset the user's scroll.
 */
export default function useTabScrollPreservation() {
  const location = useLocation();
  const scrollPositions = useRef({});
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const currentPath = location.pathname;
    const savedY = scrollPositions.current[currentPath] ?? 0;

    // Save previous path scroll before navigating away
    const handleBeforeUnload = () => {
      scrollPositions.current[prevPath.current] = window.scrollY;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Restore scroll for the new path
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedY, behavior: 'instant' });
    });

    return () => {
      // Save on cleanup (route change)
      scrollPositions.current[prevPath.current] = window.scrollY;
      prevPath.current = currentPath;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);
}