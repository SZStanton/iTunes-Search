// Every secret that is published in the repo: the code's own fallback, and the
// placeholder in .env.example. Either would let anyone sign a valid token
const FALLBACK_SECRET = 'dev-secret-key';
const PUBLISHED_SECRETS = [FALLBACK_SECRET, 'change-me'];

// Reports everything that is wrong at once. Finding out about a second missing
// variable only after fixing the first is a slow way to configure a host
function checkEnv({ env = process.env } = {}) {
  // Anything that is not explicitly development is treated as production. A
  // host that forgets to set NODE_ENV then fails loudly, rather than quietly
  // booting on the placeholder secret, which is the way round that is safe
  const production = env.NODE_ENV !== 'development';
  const problems = [];
  const warnings = [];

  if (!env.MONGODB_URI) {
    problems.push('MONGODB_URI is not set. Copy server/.env.example to .env');
  }

  if (production) {
    // Falling back here is the dangerous one, because nothing looks broken:
    // the app runs, and anyone can sign tokens with the published placeholder
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
