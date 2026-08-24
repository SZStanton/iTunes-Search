import { z } from 'zod';

// Mirrors server/validation/authSchemas.js so the form can check first.
// authRules.test.js asserts both produce the same message, word for word.

const emailField = z
  .string({ error: 'Email is required.' })
  .trim()
  .min(1, 'Email is required.')
  .toLowerCase()
  .pipe(z.email('Please enter a valid email address.'));

// 72 is bcrypt's limit. Anything longer is silently truncated, so reject it.
const passwordField = z
  .string({ error: 'Password is required.' })
  .min(1, 'Password is required.')
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be 72 characters or less.');

const registerRules = z.object({
  email: emailField,
  password: passwordField,
});

// Only checks something was typed, matching the server. The length rules
// would lock out anyone who signed up under different ones.
const loginRules = z.object({
  email: emailField,
  password: z
    .string({ error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

// Turns a failed parse into the { field: message } shape the API returns.
function rulesErrors(error) {
  const errors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) errors[field] = issue.message;
  }

  return errors;
}

export { loginRules, registerRules, rulesErrors };
