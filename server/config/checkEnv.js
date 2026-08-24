// Every secret published in the repo. Either would let anyone sign a token.
const FALLBACK_SECRET = 'dev-secret-key';
const PUBLISHED_SECRETS = [FALLBACK_SECRET, 'change-me'];

// Report everything wrong at once. One variable at a time is a slow way to
// configure a host.
function checkEnv({ env = process.env } = {}) {
  // Anything not explicitly development is production, so a forgotten
  // NODE_ENV fails loudly rather than booting on the placeholder.
  const production = env.NODE_ENV !== 'development';
  const problems = [];
  const warnings = [];

  if (!env.MONGODB_URI) {
    problems.push('MONGODB_URI is not set. Copy server/.env.example to .env');
  }

  if (production) {
    // The dangerous one, because nothing looks broken. The app runs and anyone
    // can sign tokens with the published placeholder.
    if (!env.JWT_SECRET || PUBLISHED_SECRETS.includes(env.JWT_SECRET)) {
      problems.push(
        'JWT_SECRET must be set to a real value in production, not one of the placeholders in the repo',
      );
    }

    if (!env.CLIENT_URL) {
      warnings.push(
        'CLIENT_URL is not set, so CORS will only allow localhost and the deployed site will be refused',
      );
    }
  } else if (!env.JWT_SECRET) {
    warnings.push(
      `JWT_SECRET is not set, falling back to "${FALLBACK_SECRET}"`,
    );
  }

  return { problems, warnings };
}

export { FALLBACK_SECRET, PUBLISHED_SECRETS, checkEnv };
