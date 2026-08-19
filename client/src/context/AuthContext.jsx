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

  // A stored token is only a guess until the server agrees, so the app waits.
  // Having the account already is what ends the wait, which is why 'user' is in
  // here: a fresh login sets both at once and must not wait for a check that
  // will never run
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
    // has already handed us the account
    if (!token || user) return;

    let cancelled = false;

    const check = async () => {
      try {
        const data = await apiFetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!cancelled) setUser(data.user);
      } catch (err) {
        // Only the server saying no means the token is bad. A timeout while the
        // free tier wakes up must not sign someone out and lose their token
        const rejected = err.status === 401 || err.status === 403;

        if (!cancelled && rejected) logout();
      } finally {
        if (!cancelled) setChecked(true);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [token, user, logout]);

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
      signedIn: Boolean(token && user),
      login: credentials => post('/api/auth/login', credentials),
      register: credentials => post('/api/auth/register', credentials),
      loginAsDemo: () => post('/api/auth/demo'),
      logout,
    }),
    [token, user, checking, post, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider, TOKEN_KEY };
