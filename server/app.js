import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authenticateToken from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimits.js';
import authRoutes from './routes/authRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';
import itunesRoutes from './routes/itunesRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv resolves from the working directory and the tests run from the repo
// root, so point it at the server's own file.
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

const app = express();

// Only the frontend calls this, so a bare cors() would open it wider than
// it ever needs.
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Render sits behind a proxy, so the client IP is in x-forwarded-for. One hop
// only, or the header can be spoofed to dodge the rate limit.
app.set('trust proxy', 1);

// Pinged on every page load, so a sleeping instance wakes before anyone clicks.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register and login are open, everything past them is not. The limiter is
// per route inside, since /me needs a looser bucket.
app.use('/api/auth', authRoutes);

app.use('/api/itunes', apiLimiter, authenticateToken, itunesRoutes);
app.use('/api/favourites', apiLimiter, authenticateToken, favouriteRoutes);
app.use('/api/searches', apiLimiter, authenticateToken, searchRoutes);

// Past every route above, so an unmatched api path 404s rather than falling
// into the SPA and returning index.html with a 200.
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'No such endpoint.' });
});

if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '..', 'client', 'dist');

  app.use(express.static(clientPath));

  // Express 5 rejects a bare '*'. The wildcard has to be a named splat now.
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

const SAFE_TO_REPEAT = new Set([400, 413]);

// Anything a route throws lands here. Express counts four arguments to spot
// a handler, so the unused 'next' has to stay.
app.use((err, req, res, _next) => {
  console.error(err);

  // body-parser sets 400 on bad json and 413 on an oversized body. Reporting
  // either as a 500 sends the client looking in the wrong place.
  const status = err.status ?? err.statusCode ?? 500;
  // Only those two are safe to repeat. A failed sendFile leaks an absolute
  // server path in its ENOENT.
  const message = SAFE_TO_REPEAT.has(status)
    ? err.message
    : 'Something went wrong on the server.';

  res.status(status).json({ message });
});

export default app;
