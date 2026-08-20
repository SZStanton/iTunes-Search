import { act, render, screen, waitFor } from '@testing-library/react';
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
  it('offers dark when the system is light', () => {
    render(<ThemeToggle />);

    expect(
      screen.getByRole('button', { name: /switch to dark/i }),
    ).toBeInTheDocument();
  });

  it('offers light when the system is dark', () => {
    systemPrefers('dark');
    render(<ThemeToggle />);

    expect(
      screen.getByRole('button', { name: /switch to light/i }),
    ).toBeInTheDocument();
  });

  it('switches, and says so', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /switch to dark/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(
      screen.getByRole('button', { name: /switch to light/i }),
    ).toBeInTheDocument();
  });

  it('switches back again', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /switch to dark/i }));
    await user.click(screen.getByRole('button', { name: /switch to light/i }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('suppresses transitions during the swap, then stops', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /switch to dark/i }));

    // Cleared on a frame and again on a timeout, since a hidden tab throttles
    // rAF to nothing and the class would otherwise stick
    await waitFor(() =>
      expect(
        document.documentElement.classList.contains('theme-swapping'),
      ).toBe(false),
    );
  });

  it('keeps up when the system changes and nobody has chosen', () => {
    render(<ThemeToggle />);

    expect(listeners).toHaveLength(1);
    // Fired by the browser rather than by React, so it needs flushing
    act(() => listeners[0]({ matches: true }));

    expect(
      screen.getByRole('button', { name: /switch to light/i }),
    ).toBeInTheDocument();
  });

  it('ignores the system once a choice has been made', () => {
    localStorage.setItem(THEME_KEY, 'light');
    render(<ThemeToggle />);

    expect(listeners).toHaveLength(0);
  });
});
