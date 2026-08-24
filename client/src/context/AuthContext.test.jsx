import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, TOKEN_KEY } from './AuthContext';
import { useAuth } from './useAuth';

// The pages mock this hook, so nothing else exercises the provider. A login
// stuck on "checking" is invisible from those tests.

const fetchMock = vi.fn();

function Probe() {
  const { checking, signedIn, user, unreachable, retryCheck, login, logout } =
    useAuth();

  return (
    <div>
      <p data-testid="state">
        {checking ? 'checking' : signedIn ? 'signed in' : 'signed out'}
      </p>
      <p data-testid="email">{user?.email ?? ''}</p>
      <p data-testid="unreachable">{unreachable ? 'unreachable' : ''}</p>
      <button type="button" onClick={retryCheck}>
        retry
      </button>
      <button
        type="button"
        onClick={() =>
          login({
            email: 'jordan.blake@example.test',
            password: 'correct-horse',
          })
        }
      >
        log in
      </button>
      <button type="button" onClick={logout}>
        log out
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

function reply(body, ok = true, status = 200) {
  fetchMock.mockResolvedValueOnce({ ok, status, json: async () => body });
}

const session = {
  token: 'a-real-token',
  user: { id: 'u1', email: 'jordan.blake@example.test' },
};

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('with no stored token', () => {
  it('is signed out immediately, with nothing to check', () => {
    renderProbe();

    expect(screen.getByTestId('state')).toHaveTextContent('signed out');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('signs in without getting stuck on the checking state', async () => {
    reply(session);
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('signed in'),
    );
    expect(screen.getByTestId('email')).toHaveTextContent(
      'jordan.blake@example.test',
    );
  });

  it('remembers the token so a reload stays signed in', async () => {
    reply(session);
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =>
      expect(localStorage.getItem(TOKEN_KEY)).toBe(session.token),
    );
  });

  it('forgets the token on sign out', async () => {
    reply(session);
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('signed in'),
    );

    await user.click(screen.getByRole('button', { name: /log out/i }));

    expect(screen.getByTestId('state')).toHaveTextContent('signed out');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('with a stored token', () => {
  beforeEach(() => {
    localStorage.setItem(TOKEN_KEY, 'stored-token');
  });

  it('waits while the server is asked whether it still works', async () => {
    reply({ user: session.user });
    renderProbe();

    expect(screen.getByTestId('state')).toHaveTextContent('checking');

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('signed in'),
    );
  });

  it('throws the token away when the server rejects it', async () => {
    reply({ message: 'Account no longer exists' }, false, 401);
    renderProbe();

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('signed out'),
    );
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('keeps the token when the server could not be reached', async () => {
    // The free tier waking up, not a rejection. Signing out here would lose a
    // perfectly good token.
    fetchMock.mockRejectedValueOnce(
      Object.assign(new Error('Request failed: 502'), { status: 502 }),
    );
    renderProbe();

    await waitFor(() =>
      expect(screen.getByTestId('unreachable')).toHaveTextContent(
        'unreachable',
      ),
    );
    expect(localStorage.getItem(TOKEN_KEY)).toBe('stored-token');
  });

  it('can be asked to check again once the server is awake', async () => {
    fetchMock.mockRejectedValueOnce(
      Object.assign(new Error('Request failed: 502'), { status: 502 }),
    );
    const user = userEvent.setup();
    renderProbe();

    await waitFor(() =>
      expect(screen.getByTestId('unreachable')).toHaveTextContent(
        'unreachable',
      ),
    );

    reply({ user: session.user });
    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('signed in'),
    );
    expect(screen.getByTestId('unreachable')).toHaveTextContent('');
  });
});
