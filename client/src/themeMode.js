// Only an explicit choice is stored. Persisting the inferred default would
// freeze whatever the system said the first time, and a later OS switch would
// be ignored forever
const THEME_KEY = 'itunes-search:theme';

function storedTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    // Storage can be blocked outright, and that should mean following the
    // system rather than breaking
    return null;
  }
}

function systemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function activeTheme() {
  return storedTheme() ?? systemTheme();
}

// The attribute is only ever set for an explicit choice. With it absent the
// media query in index.css governs, which is what "follow the system" means
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not remembering it is survivable, the page is already the right colour
  }
}

export { THEME_KEY, activeTheme, applyTheme, storedTheme, systemTheme };
