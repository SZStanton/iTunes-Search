import { describe, expect, it } from 'vitest';
import { loginRules, registerRules, rulesErrors } from './authRules.js';
import {
  loginSchema,
  registerSchema,
} from '../../../server/validation/authSchemas.js';

// The rules exist twice, once here and once on the server, so they will drift.
// Every awkward value goes through both and the messages must be identical, or
// the form says one thing and the API says another for the same input

function messagesFrom(schema, value) {
  const result = schema.safeParse(value);
  return result.success ? null : rulesErrors(result.error);
}

const awkwardEmails = [
  undefined,
  '',
  '   ',
  'jordan.blake',
  'jordan@',
  '@example.test',
  'not an email',
  'jordan blake@example.test',
  'jordan.blake@example.test',
  '  Jordan.Blake@Example.Test  ',
];

const awkwardPasswords = [
  undefined,
  '',
  ' ',
  'short',
  'short12',
  'eight888',
  'a'.repeat(72),
  'a'.repeat(73),
];

describe('the register rules on both sides', () => {
  it.each(awkwardEmails)('agree about the email %j', email => {
    const value = { email, password: 'correct-horse' };

    expect(messagesFrom(registerRules, value)).toEqual(
      messagesFrom(registerSchema, value),
    );
  });

  it.each(awkwardPasswords)('agree about the password %j', password => {
    const value = { email: 'jordan.blake@example.test', password };

    expect(messagesFrom(registerRules, value)).toEqual(
      messagesFrom(registerSchema, value),
    );
  });

  it('agree when both fields are wrong at once', () => {
    const value = { email: 'nope', password: '' };

    expect(messagesFrom(registerRules, value)).toEqual(
      messagesFrom(registerSchema, value),
    );
  });

  it('normalise the email the same way', () => {
    const value = {
      email: '  Jordan.Blake@Example.Test  ',
      password: 'correct-horse',
    };

    expect(registerRules.parse(value).email).toBe(
      registerSchema.parse(value).email,
    );
  });
});

describe('the login rules on both sides', () => {
  it.each(awkwardEmails)('agree about the email %j', email => {
    const value = { email, password: 'anything' };

    expect(messagesFrom(loginRules, value)).toEqual(
      messagesFrom(loginSchema, value),
    );
  });

  it.each(awkwardPasswords)('agree about the password %j', password => {
    const value = { email: 'jordan.blake@example.test', password };

    expect(messagesFrom(loginRules, value)).toEqual(
      messagesFrom(loginSchema, value),
    );
  });

  it('both let a short password through, unlike registering', () => {
    const value = { email: 'jordan.blake@example.test', password: 'short' };

    expect(messagesFrom(loginRules, value)).toBeNull();
    expect(messagesFrom(loginSchema, value)).toBeNull();
  });
});
