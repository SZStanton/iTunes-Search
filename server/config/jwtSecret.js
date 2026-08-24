import { FALLBACK_SECRET } from './checkEnv.js';

// Read when called, never at import. app.js loads dotenv after its imports,
// so a value captured at the top would be undefined.
function jwtSecret() {
  return process.env.JWT_SECRET || FALLBACK_SECRET;
}

export { jwtSecret };
