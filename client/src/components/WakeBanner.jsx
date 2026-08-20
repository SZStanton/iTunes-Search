import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

// The API goes to sleep when nobody has used it for a while, and the first
// request is what wakes it. Firing that on open means the wait happens while
// someone is still reading the page rather than after they click something
const SLOW_AFTER_MS = 2000;

function WakeBanner() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // A warm server answers in well under this, so nothing is ever said about
    // a wait that is not happening
    const timer = setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, SLOW_AFTER_MS);

    apiFetch('/api/health')
      // Nothing to say if it fails. The next real request surfaces that itself
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
      <p className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted card-shadow">
        <span className="size-2 animate-pulse rounded-full bg-accent-strong" />
        Getting things ready, the first load can take a moment.
      </p>
    </div>
  );
}

export default WakeBanner;
