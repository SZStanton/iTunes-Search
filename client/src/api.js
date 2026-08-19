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
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export { apiUrl, apiFetch };
