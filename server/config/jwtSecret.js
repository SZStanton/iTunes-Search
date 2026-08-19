import { FALLBACK_SECRET } from './checkEnv.js';

// Read when it is called, never at import time. app.js loads dotenv in its own
// body, which runs after the modules it imports, so a value captured at the top
// of one of those would be undefined
function jwtSecret() {
  return process.env.JWT_SECRET || FALLBACK_SECRET;
}

export { jwtSecret };
