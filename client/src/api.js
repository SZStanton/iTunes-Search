// Empty in development, where the Vite proxy forwards /api. In production
// the API is a different origin and needs the base.
const BASE = import.meta.env.VITE_API_URL ?? '';

function apiUrl(path) {
  return `${BASE}${path}`;
}

// An error still parses as JSON, so check the status before trusting the body.
async function apiFetch(path, options) {
  let res;

  try {
    res = await fetch(apiUrl(path), options);
  } catch (cause) {
    // A rejected fetch is the connection, not the API. 'Failed to fetch'
    // means nothing to anyone.
    const error = new Error(
      'Could not reach the server. Try that again in a moment.',
    );

    error.offline = true;
    error.cause = cause;

    throw error;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.message || `Request failed: ${res.status}`);

    // Validation errors come back keyed by field, so a form can put each one
    // beside its input.
    error.status = res.status;
    error.errors = body.errors ?? {};

    throw error;
  }

  return res.json();
}

// The same with the session's token attached, which is every signed in call.
function authFetch(path, token, options = {}) {
  return apiFetch(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
}

export { apiUrl, apiFetch, authFetch };
