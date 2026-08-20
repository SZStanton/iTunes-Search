import { afterEach, describe, expect, it, vi } from 'vitest';

// The base is read once when the module loads, so each case needs a fresh import
async function loadApi(base) {
  vi.resetModules();
  if (base === undefined) vi.stubEnv('VITE_API_URL', '');
  else vi.stubEnv('VITE_API_URL', base);

  return import('./api.js');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('working out where the api is', () => {
  it('uses a relative path when no base is set, so the dev proxy works', async () => {
    const { apiUrl } = await loadApi(undefined);

    expect(apiUrl('/api/token')).toBe('/api/token');
  });

  it('puts the base in front when one is set', async () => {
    const { apiUrl } = await loadApi('https://api.example.test');

    expect(apiUrl('/api/token')).toBe('https://api.example.test/api/token');
  });
});

describe('calling the api', () => {
  it('returns the parsed body when the request succeeds', async () => {
    const { apiFetch } = await loadApi(undefined);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ token: 'x' }) }),
    );

    await expect(apiFetch('/api/token')).resolves.toEqual({ token: 'x' });
  });

  it('says the server could not be reached when nothing answers', async () => {
    const { apiFetch } = await loadApi(undefined);
    // What a dropped connection looks like: the fetch itself rejects, so there
    // is no response, no status and no body
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await expect(apiFetch('/api/auth/demo')).rejects.toMatchObject({
      message: 'Could not reach the server. Try that again in a moment.',
      offline: true,
    });
  });

  it("throws with the server's own message when it fails", async () => {
    const { apiFetch } = await loadApi(undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Search term is required' }),
      }),
    );

    await expect(apiFetch('/api/itunes/search')).rejects.toThrow(
      'Search term is required',
    );
  });

  it('falls back to the status when the body has no message', async () => {
    const { apiFetch } = await loadApi(undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error('not json');
        },
      }),
    );

    await expect(apiFetch('/api/token')).rejects.toThrow('502');
  });
});
