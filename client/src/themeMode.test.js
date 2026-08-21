import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_KEY,
  activeTheme,
  applyTheme,
  storedTheme,
} from './themeMode';

// Stubbed only to prove nothing reads it any more
function systemPrefers(scheme) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(query => ({
      matches: query.includes('dark') && scheme === 'dark',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  systemPrefers('light');
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('working out which theme to use', () => {
  it('starts dark when nothing has been chosen', () => {
    expect(DEFAULT_THEME).toBe('dark');
    expect(storedTheme()).toBeNull();
    expect(activeTheme()).toBe('dark');
  });

  it('ignores the system, whichever way it is set', () => {
    systemPrefers('light');
    expect(activeTheme()).toBe('dark');

    systemPrefers('dark');
    expect(activeTheme()).toBe('dark');
  });

  it('lets an explicit choice beat the default', () => {
    localStorage.setItem(THEME_KEY, 'light');

    expect(activeTheme()).toBe('light');
  });

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem(THEME_KEY, 'banana');

    expect(storedTheme()).toBeNull();
    expect(activeTheme()).toBe('dark');
  });

  it('falls back to the default rather than breaking when storage is blocked', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });

    expect(storedTheme()).toBeNull();
    expect(activeTheme()).toBe('dark');

    getItem.mockRestore();
  });
});

describe('choosing one', () => {
  it('sets the attribute the css and tailwind both key off', () => {
    applyTheme('dark');

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('remembers it, so a reload does not undo the choice', () => {
    applyTheme('dark');

    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('still paints when storage refuses to remember it', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });

    expect(() => applyTheme('dark')).not.toThrow();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    setItem.mockRestore();
  });

  it('never stores anything until someone actually chooses', () => {
    // Persisting the inferred default would freeze the system preference and a
    // later OS switch would be ignored forever
    activeTheme();

    expect(localStorage.getItem(THEME_KEY)).toBeNull();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
