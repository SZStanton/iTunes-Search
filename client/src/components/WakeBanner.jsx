import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

// The first request wakes a sleeping API, so it is fired on open and the wait
// lands while someone is still reading rather than after they click
const SLOW_AFTER_MS = 2000;

function WakeBanner() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // A warm server answers well inside this, so it never mentions a wait
    const timer = setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, SLOW_AFTER_MS);

    apiFetch('/api/health')
      // The next real request surfaces a failure itself
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        if (!cancelled) setSlow(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!slow) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <p className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted elev-2">
        <span className="size-2 animate-pulse rounded-full bg-accent-strong" />
        Getting things ready, the first load can take a moment.
      </p>
    </div>
  );
}

export default WakeBanner;
