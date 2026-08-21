import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle from './ThemeToggle';
import { THEME_KEY } from '../themeMode';

let listeners = [];

function systemPrefers(scheme) {
  listeners = [];

  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(query => ({
      matches: query.includes('dark') && scheme === 'dark',
      addEventListener: (_event, handler) => listeners.push(handler),
      removeEventListener: () => {},
    })),
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.classList.remove('theme-swapping');
  systemPrefers('light');
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('the theme toggle', () => {
  it('offers light, since dark is what everyone starts on', () => {
    render(<ThemeToggle />);

    expect(
      screen.getByRole('button', { name: /switch to light/i }),
    ).toBeInTheDocument();
  });

  it('starts dark even on a system set to light', () => {
    systemPrefers('light');
    render(<ThemeToggle />);

    expect(
      screen.getByRole('button', { name: /switch to light/i }),
    ).toBeInTheDocument();
  });

  it('switches, and says so', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /switch to light/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
    expect(
      screen.getByRole('button', { name: /switch to dark/i }),
    ).toBeInTheDocument();
  });

  it('switches back again', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /switch to light/i }));
    await user.click(screen.getByRole('button', { name: /switch to dark/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('keeps a stored choice of light', () => {
    localStorage.setItem(THEME_KEY, 'light');
    render(<ThemeToggle />);

    expect(
      screen.getByRole('button', { name: /switch to dark/i }),
    ).toBeInTheDocument();
  });

  it('never asks the system what it prefers', () => {
    systemPrefers('light');
    render(<ThemeToggle />);

    // Nothing subscribes, because the system no longer decides anything
    expect(listeners).toHaveLength(0);
  });

  it('suppresses transitions during the swap, then stops', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /switch to light/i }));

    // Cleared on a frame and again on a timeout, since a hidden tab throttles
    // rAF to nothing and the class would otherwise stick
    await waitFor(() =>
      expect(
        document.documentElement.classList.contains('theme-swapping'),
      ).toBe(false),
    );
  });
});
