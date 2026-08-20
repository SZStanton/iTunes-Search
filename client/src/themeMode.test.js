import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_KEY,
  activeTheme,
  applyTheme,
  storedTheme,
  systemTheme,
} from './themeMode';

// jsdom has no matchMedia, and it is the whole point of "follow the system"
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
  it('follows the system when nothing has been chosen', () => {
    systemPrefers('dark');

    expect(storedTheme()).toBeNull();
    expect(systemTheme()).toBe('dark');
    expect(activeTheme()).toBe('dark');
  });

  it('lets an explicit choice beat the system', () => {
    systemPrefers('dark');
    localStorage.setItem(THEME_KEY, 'light');

    expect(activeTheme()).toBe('light');
  });

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem(THEME_KEY, 'banana');

    expect(storedTheme()).toBeNull();
    expect(activeTheme()).toBe('light');
  });

  it('follows the system rather than breaking when storage is blocked', () => {
    systemPrefers('dark');
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
