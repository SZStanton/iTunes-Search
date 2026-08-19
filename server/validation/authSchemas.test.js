import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './authSchemas.js';

// Returns the first message for a field, or undefined when it passed
function messageFor(schema, value, field) {
  const result = schema.safeParse(value);
  if (result.success) return undefined;
  return result.error.issues.find(issue => issue.path[0] === field)?.message;
}

const validRegistration = {
  email: 'jordan.blake@example.test',
  password: 'correct-horse',
};

describe('registering', () => {
  it('accepts a sensible email and password', () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('lowercases and trims the email, so lookups match either way', () => {
    const parsed = registerSchema.parse({
      ...validRegistration,
      email: '  Jordan.Blake@Example.Test  ',
    });

    expect(parsed.email).toBe('jordan.blake@example.test');
  });

  it.each([
    ['missing', undefined, 'Email is required.'],
    ['empty', '', 'Email is required.'],
    ['only spaces', '   ', 'Email is required.'],
    ['no at sign', 'jordan.blake', 'Please enter a valid email address.'],
    ['no domain', 'jordan@', 'Please enter a valid email address.'],
    ['a sentence', 'not an email', 'Please enter a valid email address.'],
  ])('rejects an email that is %s', (_label, email, expected) => {
    expect(
      messageFor(registerSchema, { ...validRegistration, email }, 'email'),
    ).toBe(expected);
  });

  it.each([
    ['missing', undefined, 'Password is required.'],
    ['empty', '', 'Password is required.'],
    ['seven characters', 'short12', 'Password must be at least 8 characters.'],
  ])('rejects a password that is %s', (_label, password, expected) => {
    expect(
      messageFor(
        registerSchema,
        { ...validRegistration, password },
        'password',
      ),
    ).toBe(expected);
  });

  it('accepts a password of exactly eight characters', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: 'eight888',
    });

    expect(result.success).toBe(true);
  });

  it("accepts a password of exactly 72 bytes, bcrypt's limit", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: 'a'.repeat(72),
    });

    expect(result.success).toBe(true);
  });

  it('rejects a password past 72, rather than letting bcrypt truncate it', () => {
    expect(
      messageFor(
        registerSchema,
        { ...validRegistration, password: 'a'.repeat(73) },
        'password',
      ),
    ).toBe('Password must be 72 characters or less.');
  });

  it('reports both fields at once, not just the first', () => {
    const result = registerSchema.safeParse({ email: '', password: '' });
    const fields = [
      ...new Set(result.error.issues.map(issue => issue.path[0])),
    ];

    expect(result.success).toBe(false);
    expect(fields.sort()).toEqual(['email', 'password']);
  });
});

describe('logging in', () => {
  it('accepts any non-empty password, so old accounts still work', () => {
    const result = loginSchema.safeParse({
      email: 'jordan.blake@example.test',
      password: 'short',
    });

    expect(result.success).toBe(true);
  });

  it('still insists on something being typed', () => {
    expect(
      messageFor(
        loginSchema,
        { email: 'jordan.blake@example.test', password: '' },
        'password',
      ),
    ).toBe('Password is required.');
  });

  it('applies the same email rules as registering', () => {
    expect(
      messageFor(loginSchema, { email: 'nope', password: 'whatever' }, 'email'),
    ).toBe('Please enter a valid email address.');
  });
});
