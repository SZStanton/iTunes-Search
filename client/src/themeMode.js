// Only an explicit choice is stored, so an empty slot always means the default
const THEME_KEY = 'itunes-search:theme';

// The app picks a side rather than following the system. Artwork is the point,
// and it sits better on black
const DEFAULT_THEME = 'dark';

function storedTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    // Storage can be blocked outright, and that should mean the default rather
    // than breaking
    return null;
  }
}

function activeTheme() {
  return storedTheme() ?? DEFAULT_THEME;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not remembering it is survivable, the page is already the right colour
  }
}

export { DEFAULT_THEME, THEME_KEY, activeTheme, applyTheme, storedTheme };
