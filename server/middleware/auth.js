import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { jwtSecret } from '../config/jwtSecret.js';
import { touchAccount } from '../config/retention.js';

// JWT Auth Middleware, checks the request carries a token for a real account
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // Makes sure authorization header exists and has right format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  let payload;

  try {
    // Verify token signature and expiry
    payload = jwt.verify(token, jwtSecret());
  } catch {
    return res.status(403).json({ message: 'Invalid token' });
  }

  // Inactive accounts are deleted by a TTL index, so a signature can still be
  // valid for someone who is no longer there
  const user = await User.findById(payload.sub).catch(() => null);

  if (!user) {
    return res.status(401).json({ message: 'Account no longer exists' });
  }

  req.user = user;

  // Using the app is what keeps the account alive, so every guarded request
  // counts as activity. Housekeeping though, so a failure here must not turn
  // someone's read into a 500
  try {
    await touchAccount(user);
  } catch (err) {
    console.error('Could not refresh the expiry for', user.id, err);
  }

  next();
}

export default authenticateToken;
