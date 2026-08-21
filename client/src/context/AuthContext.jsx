import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch } from '../api';

// Only an explicit login is stored. Nothing else is kept about the person
const TOKEN_KEY = 'itunes-search:token';

const AuthContext = createContext(null);

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    // Storage can be blocked entirely in a locked-down browser, and that should
    // mean signing in again rather than a blank page
    return '';
  }
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken);
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  // Set when the check could not reach the server, as opposed to being refused
  const [unreachable, setUnreachable] = useState(false);
  // Bumped to run the check again, since nothing else in its deps changes
  const [attempt, setAttempt] = useState(0);

  // A stored token is only a guess until the server agrees. 'user' ends the
  // wait too, or a fresh login sits waiting for a check that never runs
  const checking = Boolean(token) && !user && !checked;

  const saveSession = useCallback(session => {
    try {
      localStorage.setItem(TOKEN_KEY, session.token);
    } catch {
      // Not being able to remember them is survivable, being logged out is not
    }

    setToken(session.token);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing to do, the state below is what the app actually reads
    }

    setToken('');
    setUser(null);
  }, []);

  // A stored token may be expired, or belong to an account the retention sweep
  // has since deleted, so it gets checked once on load
  useEffect(() => {
    // Nothing to check with no token, and nothing to check again once a login
    // has already provided the account
    if (!token || user) return;

    let cancelled = false;

    const check = async () => {
      try {
        const data = await apiFetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (cancelled) return;

        setUser(data.user);
        setUnreachable(false);
      } catch (err) {
        if (cancelled) return;

        // Only the server saying no means the token is bad. Anything else is
        // the free tier waking up, and that must not cost someone their token
        const rejected = err.status === 401 || err.status === 403;

        if (rejected) logout();
        else setUnreachable(true);
      } finally {
        if (!cancelled) setChecked(true);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [token, user, logout, attempt]);

  // Offered to someone stuck behind an unreachable server, so a cold start does
  // not leave them on the login page with a token that is perfectly good
  const retryCheck = useCallback(() => {
    setChecked(false);
    setUnreachable(false);
    setAttempt(count => count + 1);
  }, []);

  const post = useCallback(
    async (path, body) => {
      const session = await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      saveSession(session);

      return session;
    },
    [saveSession],
  );

  const value = useMemo(
    () => ({
      token,
      user,
      checking,
      // A stored token that could not be verified, not a rejected one
      unreachable: unreachable && Boolean(token) && !user,
      retryCheck,
      signedIn: Boolean(token && user),
      login: credentials => post('/api/auth/login', credentials),
      register: credentials => post('/api/auth/register', credentials),
      loginAsDemo: () => post('/api/auth/demo'),
      logout,
    }),
    [token, user, checking, unreachable, retryCheck, post, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider, TOKEN_KEY };
