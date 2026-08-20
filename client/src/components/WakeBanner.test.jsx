import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetch = vi.fn();

vi.mock('../api', () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

const { default: WakeBanner } = await import('./WakeBanner.jsx');

beforeEach(() => {
  vi.useFakeTimers();
  apiFetch.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('waking the api', () => {
  it('pings the health route as soon as the app opens', () => {
    apiFetch.mockResolvedValue({ status: 'ok' });

    render(<WakeBanner />);

    expect(apiFetch).toHaveBeenCalledWith('/api/health');
  });

  it('stays quiet when the api answers straight away', async () => {
    apiFetch.mockResolvedValue({ status: 'ok' });

    render(<WakeBanner />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('explains the wait once the api is slow, then gets out of the way', async () => {
    let answer;
    apiFetch.mockReturnValue(
      new Promise(resolve => {
        answer = resolve;
      }),
    );

    render(<WakeBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByRole('status')).toHaveTextContent(/first load/i);

    await act(async () => {
      answer({ status: 'ok' });
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('says nothing when the ping fails, since a real request will', async () => {
    apiFetch.mockRejectedValue(new Error('Could not reach the server.'));

    render(<WakeBanner />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
