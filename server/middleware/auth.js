import jwt from 'jsonwebtoken';

// JWT Auth Middleware, checks if request contains a valid Bearer token.
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // Makes sure authorization header exists and has right format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

  try {
    // Verify token signature and expiry
    const payload = jwt.verify(token, JWT_SECRET);

    // Save the token payload on the request in case we need it later
    req.user = payload;

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

export default authenticateToken;
