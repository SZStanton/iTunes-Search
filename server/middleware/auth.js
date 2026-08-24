import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { jwtSecret } from '../config/jwtSecret.js';
import { touchAccount } from '../config/retention.js';

// A valid signature is not enough. The account behind it has to still exist.
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  let payload;

  try {
    payload = jwt.verify(token, jwtSecret());
  } catch {
    return res.status(403).json({ message: 'Invalid token' });
  }

  // A TTL index deletes inactive accounts, so a signature can outlive its
  // owner.
  const user = await User.findById(payload.sub).catch(() => null);

  if (!user) {
    return res.status(401).json({ message: 'Account no longer exists' });
  }

  req.user = user;

  // Using the app keeps the account alive. Housekeeping though, so a failure
  // must not turn a read into a 500.
  try {
    await touchAccount(user);
  } catch (err) {
    console.error('Could not refresh the expiry for', user.id, err);
  }

  next();
}

export default authenticateToken;
