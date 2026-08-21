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

// Path Setup, convert file URL into normal file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv resolves from the working directory and the tests run from the repo
// root, so point it at the server's own file instead
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

// App Setup, create express app
const app = express();

// Only the frontend needs to call this, and in production it is served from the
// same origin anyway, so a bare cors() opens it wider than it ever needs
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware, allows requests from frontend and lets express read JSON data
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Render sits behind a proxy, so the client IP is in x-forwarded-for. Trust one
// hop only, or anyone could spoof the header and dodge the rate limit
app.set('trust proxy', 1);

// Health Check, used to confirm the API is up without running a search
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth Routes, register and login are open, everything past them is not. The
// limiter is applied per route inside, since /me runs on every page load and
// must not share a bucket sized for password guessing
app.use('/api/auth', authRoutes);

// API Routes, protect itunes search routes with JWT middleware
app.use('/api/itunes', apiLimiter, authenticateToken, itunesRoutes);
app.use('/api/favourites', apiLimiter, authenticateToken, favouriteRoutes);
app.use('/api/searches', apiLimiter, authenticateToken, searchRoutes);

// Past every route above, so an unmatched api path answers as itself rather
// than falling into the SPA below and returning index.html with a 200
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'No such endpoint.' });
});

// React Frontend, serve built Vite app from the client's dist folder
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '..', 'client', 'dist');

  app.use(express.static(clientPath));

  // Express 5 rejects a bare '*', the wildcard has to be a named splat now
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Anything a route throws lands here. Express spots an error handler by its four
// arguments, so the unused 'next' has to stay
app.use((err, req, res, _next) => {
  console.error(err);

  // body-parser puts 400 on malformed json and 413 on an oversized body, and
  // reporting either as a 500 sends the client looking in the wrong place
  const status = err.status ?? err.statusCode ?? 500;
  const message =
    status === 500 ? 'Something went wrong on the server.' : err.message;

  res.status(status).json({ message });
});

export default app;
