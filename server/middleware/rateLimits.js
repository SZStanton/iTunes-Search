import rateLimit from 'express-rate-limit';

// Render runs one long-lived instance, so counting in memory actually works.
// It would not survive a move to serverless, where each request can land on a
// different instance with its own empty count

const minutes = n => n * 60 * 1000;

function limiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
    // The route sweep makes far more calls than a person would, and a test that
    // fails on the 21st request rather than on a bug is worse than no test
    skip: () => process.env.NODE_ENV === 'test',
  });
}

// Register, login and the demo. Tight, because these are the endpoints worth
// hammering: guessing passwords, or making the demo reset over and over
const authLimiter = limiter({
  windowMs: minutes(15),
  max: 20,
  message: 'Too many attempts. Wait a few minutes and try again.',
});

// Everything behind a login. Loose enough that paging and filtering never hits
// it, tight enough that a script cannot use the proxy to hammer iTunes
const apiLimiter = limiter({
  windowMs: minutes(1),
  max: 60,
  message: 'Too many requests. Slow down a little.',
});

export { apiLimiter, authLimiter };
