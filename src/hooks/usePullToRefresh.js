import { useEffect, useRef, useState, useCallback } from 'react';

// Logarithmic spring damping — same feel as iOS UIScrollView rubber-banding
function springDamp(dist, threshold) {
  return threshold * Math.log1p(dist / threshold);
}

/**
 * Pull-to-refresh hook with zero layout shift.
 *
 * Returns:
 *   - indicatorStyle: CSS style object to apply to a FIXED-position overlay indicator.
 *     It uses `transform: translateY` so the page layout is never affected.
 *   - isTriggered: boolean — true while the drag exceeds threshold (show spinner state)
 *   - isActive: boolean — true while any pull is in progress (for visibility)
 *
 * Usage in the consumer:
 *   <div style={indicatorStyle} className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
 *     {isActive && <RefreshCw className={isTriggered ? 'animate-spin' : ''} />}
 *   </div>
 *
 * Never drive document layout (height, margin, padding) with pullDistance values.
 */
export default function usePullToRefresh(onRefresh, threshold = 70) {
  const [indicatorStyle, setIndicatorStyle] = useState({ transform: 'translateY(-100%)' });
  const [isTriggered, setIsTriggered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const startY = useRef(null);
  const rawDist = useRef(0);
  const refreshing = useRef(false);

  const stableRefresh = useCallback(onRefresh, [onRefresh]);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY === 0 && !refreshing.current) {
        startY.current = e.touches[0].clientY;
        rawDist.current = 0;
      }
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const dist = e.touches[0].clientY - startY.current;
      if (dist > 0 && window.scrollY === 0) {
        rawDist.current = dist;
        const damped = springDamp(dist, threshold);
        // Clamp to a max visual displacement to prevent runaway dragging
        const clampedPx = Math.min(damped, threshold * 1.5);
        setIsActive(true);
        setIsTriggered(dist > threshold);
        // Drive only transform — zero layout shift
        setIndicatorStyle({ transform: `translateY(${clampedPx - 40}px)`, transition: 'none' });
      }
    };

    const onTouchEnd = () => {
      if (startY.current === null) return;
      if (rawDist.current > threshold && !refreshing.current) {
        refreshing.current = true;
        stableRefresh();
        // Brief pause to show spinner before snapping back
        setTimeout(() => {
          refreshing.current = false;
          snapBack();
        }, 600);
      } else {
        snapBack();
      }
      startY.current = null;
      rawDist.current = 0;
    };

    const snapBack = () => {
      setIndicatorStyle({ transform: 'translateY(-100%)', transition: 'transform 0.25s ease' });
      setIsTriggered(false);
      // Delay hiding so the snap-back animation completes before unmounting indicator
      setTimeout(() => setIsActive(false), 280);
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [stableRefresh, threshold]);

  return { indicatorStyle, isTriggered, isActive };
}