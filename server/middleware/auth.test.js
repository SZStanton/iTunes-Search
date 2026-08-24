import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import authenticateToken from './auth.js';
import { jwtSecret } from '../config/jwtSecret.js';

// A rejected request never reaches the database, so these need no connection.
// The accepted path does, and lives in the local route sweep.

function fakeRes() {
  const res = {
    statusCode: undefined,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return res;
}

async function callWith(authorization) {
  const req = { headers: authorization ? { authorization } : {} };
  const res = fakeRes();
  const next = vi.fn();

  await authenticateToken(req, res, next);

  return { req, res, next };
}

describe('turning people away', () => {
  it('refuses a request with no authorization header', async () => {
    const { res, next } = await callWith(undefined);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/missing token/i);
    expect(next).not.toHaveBeenCalled();
  });

  it('refuses a header that is not a bearer token', async () => {
    const { res, next } = await callWith('Basic abc123');

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('refuses a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ sub: 'someone' }, 'not-the-secret');
    const { res, next } = await callWith(`Bearer ${forged}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/invalid token/i);
    expect(next).not.toHaveBeenCalled();
  });

  it('refuses an expired token even though the signature is right', async () => {
    const stale = jwt.sign({ sub: 'someone' }, jwtSecret(), {
      expiresIn: '-1h',
    });
    const { res, next } = await callWith(`Bearer ${stale}`);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('refuses gibberish that is not a token at all', async () => {
    const { res, next } = await callWith('Bearer not-a-jwt');

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
});
