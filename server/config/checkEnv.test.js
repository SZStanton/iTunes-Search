import { describe, expect, it } from 'vitest';
import { FALLBACK_SECRET, PUBLISHED_SECRETS, checkEnv } from './checkEnv.js';

const production = {
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/itunes-search?x=1',
  JWT_SECRET: 'a-real-secret',
  CLIENT_URL: 'https://itunes-search.example',
};

// Only an explicit NODE_ENV=development counts as local, so a host that
// forgets it is treated as production.
const local = {
  NODE_ENV: 'development',
  MONGODB_URI: 'mongodb://127.0.0.1/itunes-search',
};

describe('checking the environment locally', () => {
  it('is happy with just a database', () => {
    const { problems } = checkEnv({ env: local });

    expect(problems).toEqual([]);
  });

  it('complains about a missing database', () => {
    const { problems } = checkEnv({ env: { NODE_ENV: 'development' } });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/MONGODB_URI/);
  });

  it('warns about the fallback secret rather than refusing to run', () => {
    const { problems, warnings } = checkEnv({ env: local });

    expect(problems).toEqual([]);
    expect(warnings.join()).toContain(FALLBACK_SECRET);
  });
});

describe('checking the environment in production', () => {
  it('is happy when everything is set', () => {
    const { problems, warnings } = checkEnv({ env: production });

    expect(problems).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('refuses to run with no secret at all', () => {
    const { JWT_SECRET, ...withoutSecret } = production;

    expect(JWT_SECRET).toBeDefined();
    expect(checkEnv({ env: withoutSecret }).problems.join()).toMatch(
      /JWT_SECRET/,
    );
  });

  it.each(PUBLISHED_SECRETS)(
    'refuses to run on the published secret %s',
    secret => {
      const { problems } = checkEnv({
        env: { ...production, JWT_SECRET: secret },
      });

      expect(problems.join()).toMatch(/JWT_SECRET/);
    },
  );

  it('guards the code fallback and the one in .env.example, not just one', () => {
    // These drifted apart once already, the check knowing one placeholder and
    // .env.example offering another.
    expect(PUBLISHED_SECRETS).toContain(FALLBACK_SECRET);
    expect(PUBLISHED_SECRETS).toContain('change-me');
  });

  it('reports both missing values at once, not one at a time', () => {
    const { problems } = checkEnv({ env: { NODE_ENV: 'production' } });

    expect(problems).toHaveLength(2);
    expect(problems.join()).toMatch(/MONGODB_URI/);
    expect(problems.join()).toMatch(/JWT_SECRET/);
  });

  it('treats a host that never sets NODE_ENV as production', () => {
    const { NODE_ENV, ...noNodeEnv } = production;
    const { problems } = checkEnv({
      env: { ...noNodeEnv, JWT_SECRET: FALLBACK_SECRET },
    });

    expect(NODE_ENV).toBe('production');
    expect(problems.join()).toMatch(/JWT_SECRET/);
  });

  it('warns about a missing client url without blocking the deploy', () => {
    const { CLIENT_URL, ...withoutClient } = production;
    const { problems, warnings } = checkEnv({ env: withoutClient });

    expect(CLIENT_URL).toBeDefined();
    expect(problems).toEqual([]);
    expect(warnings.join()).toMatch(/CLIENT_URL/);
  });
});
