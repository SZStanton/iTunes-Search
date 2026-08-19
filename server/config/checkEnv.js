// The placeholder in .env.example, which is in the repo for anyone to read
const FALLBACK_SECRET = 'dev-secret-key';

// Reports everything that is wrong at once. Finding out about a second missing
// variable only after fixing the first is a slow way to configure a host
function checkEnv({ env = process.env } = {}) {
  const production = env.NODE_ENV === 'production';
  const problems = [];
  const warnings = [];

  if (!env.MONGODB_URI) {
    problems.push('MONGODB_URI is not set. Copy server/.env.example to .env');
  }

  if (production) {
    // Falling back here is the dangerous one, because nothing looks broken:
    // the app runs, and anyone can sign tokens with the published placeholder
    if (!env.JWT_SECRET || env.JWT_SECRET === FALLBACK_SECRET) {
      problems.push(
        'JWT_SECRET must be set to a real value in production, not the placeholder',
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

export { FALLBACK_SECRET, checkEnv };
