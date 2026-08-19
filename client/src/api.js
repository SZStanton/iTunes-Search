// Empty in development, where the Vite proxy forwards /api to localhost:5000.
// In production the API is on Render, a different origin, so it needs the base
const BASE = import.meta.env.VITE_API_URL ?? '';

function apiUrl(path) {
  return `${BASE}${path}`;
}

// An error response still parses as JSON, so the status has to be checked
// before the body is trusted
async function apiFetch(path, options) {
  const res = await fetch(apiUrl(path), options);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.message || `Request failed: ${res.status}`);

    // The API answers a failed validation with errors keyed by field, and a
    // form needs those next to the inputs rather than one message at the top
    error.status = res.status;
    error.errors = body.errors ?? {};

    throw error;
  }

  return res.json();
}

// Same thing with the session's token attached, which is every call the app
// makes once someone is signed in
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
