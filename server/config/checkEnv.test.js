import { describe, expect, it } from 'vitest';
import { FALLBACK_SECRET, checkEnv } from './checkEnv.js';

const production = {
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/itunes-search?x=1',
  JWT_SECRET: 'a-real-secret',
  CLIENT_URL: 'https://itunes-search.example',
};

describe('checking the environment locally', () => {
  it('is happy with just a database', () => {
    const { problems } = checkEnv({
      env: { MONGODB_URI: 'mongodb://127.0.0.1/x' },
    });

    expect(problems).toEqual([]);
  });

  it('complains about a missing database', () => {
    const { problems } = checkEnv({ env: {} });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/MONGODB_URI/);
  });

  it('warns about the fallback secret rather than refusing to run', () => {
    const { problems, warnings } = checkEnv({
      env: { MONGODB_URI: 'mongodb://127.0.0.1/x' },
    });

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

  it('refuses to run on the placeholder secret, which is in the repo', () => {
    const { problems } = checkEnv({
      env: { ...production, JWT_SECRET: FALLBACK_SECRET },
    });

    expect(problems.join()).toMatch(/JWT_SECRET/);
  });

  it('reports both missing values at once, not one at a time', () => {
    const { problems } = checkEnv({ env: { NODE_ENV: 'production' } });

    expect(problems).toHaveLength(2);
    expect(problems.join()).toMatch(/MONGODB_URI/);
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
