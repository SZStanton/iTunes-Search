import { useEffect, useState } from 'react';
import { activeTheme, applyTheme, storedTheme } from '../themeMode';

// Suppressing transitions for a moment stops every element animating between
// the two palettes at once, which reads as a flash rather than a change
function swapWithoutFlashing(next) {
  const root = document.documentElement;

  root.classList.add('theme-swapping');
  applyTheme(next);

  // A hidden tab throttles rAF to nothing and the class would stick, so a
  // timeout clears it as well
  const done = () => root.classList.remove('theme-swapping');

  requestAnimationFrame(done);
  setTimeout(done, 200);
}

function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(activeTheme);

  // Someone who has not chosen still follows the system, so the label has to
  // keep up if they change it while the page is open
  useEffect(() => {
    if (storedTheme()) return;

    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!query) return;

    const onChange = event => setTheme(event.matches ? 'dark' : 'light');

    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';

    swapWithoutFlashing(next);
    setTheme(next);
  };

  return (
    <button
      className={`rounded-full px-3 py-1.5 text-sm text-muted transition hover:text-ink active:text-ink ${className}`}
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}

export default ThemeToggle;
