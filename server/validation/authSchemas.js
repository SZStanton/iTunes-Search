import { z } from 'zod';

// Lowercased, so lookups match however the email was typed.
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

//== REGISTER ==
const registerSchema = z.object({
  email: emailField,
  password: passwordField,
});

//== LOGIN ==
// Only checks something was typed. The length rules belong to registration,
// or changing them locks out everyone who signed up under the old ones.
const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

export { registerSchema, loginSchema };
