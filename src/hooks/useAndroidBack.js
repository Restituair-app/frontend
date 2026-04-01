import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Intercepts the Android physical back button in a WebView.
 *
 * Strategy — marker-only sentinel (no URL duplication):
 * - We push ONE sentinel state `{ androidBack: true }` on mount.
 * - On any popstate we check e.state for our marker.
 *   - If it's ours → re-push the sentinel so there's always a buffer, then navigate(-1).
 *   - If it's not ours → a browser or React Router pop occurred; do nothing.
 * - The sentinel state object is the ONLY thing we track. We never inspect or
 *   manipulate URLs, so deep links work at any history depth without side effects.
 * - `sentinelPushed` ref prevents a second sentinel during React StrictMode double-invoke.
 * - We do NOT pop the sentinel on cleanup: doing so would fire a spurious popstate
 *   during HMR or StrictMode unmount/remount cycles and cause a ghost navigation.
 *
 * Web-browser safety:
 * - On a regular browser the user's native back button fires popstate without our marker,
 *   so the handler correctly ignores it and lets the browser navigate normally.
 */
export default function useAndroidBack() {
  const navigate = useNavigate();
  const sentinelPushed = useRef(false);

  useEffect(() => {
    if (sentinelPushed.current) return;

    // Push sentinel after the current entry. Using `null` as the URL argument
    // keeps the address bar unchanged — no duplicate URL entries at any depth.
    window.history.pushState({ androidBack: true }, '');
    sentinelPushed.current = true;

    const handlePopState = (e) => {
      if (e.state && e.state.androidBack === true) {
        // Our sentinel was consumed. Restore it immediately so the next back-tap
        // is also intercepted, regardless of how many pages deep the user navigated.
        window.history.pushState({ androidBack: true }, '');
        navigate(-1);
      }
      // All other popstate events (React Router, browser history API) are untouched.
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
