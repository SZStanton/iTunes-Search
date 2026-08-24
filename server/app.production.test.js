import { afterEach, describe, expect, it, vi } from 'vitest';

// The production block only runs when NODE_ENV says so, and a bad wildcard
// throws at registration, so importing is the whole test.

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('serving the built client', () => {
  it('registers the catch-all route without express rejecting it', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();

    await expect(import('./app.js')).resolves.toBeDefined();
  });
});
