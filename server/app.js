import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import authenticateToken from './middleware/auth.js';
import itunesRoutes from './routes/itunesRoutes.js';

// Path Setup, convert file URL into normal file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv resolves from the working directory and the tests run from the repo
// root, so point it at the server's own file instead
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

// App Setup, create express app
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Only the frontend needs to call this, and in production it is served from the
// same origin anyway, so a bare cors() opens it wider than it ever needs
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware, allows requests from frontend and lets express read JSON data
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health Check, used to confirm the API is up without running a search
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// JWT Token Route, frontend calls this route to get a token before making API requests
app.get('/api/token', (req, res) => {
  const token = jwt.sign({ app: 'itunes-search' }, JWT_SECRET, {
    expiresIn: '1h',
  });

  res.json({ token });
});

// API Routes, protect itunes search routes with JWT middleware
app.use('/api/itunes', authenticateToken, itunesRoutes);

// React Frontend, serve built Vite app from the client's dist folder
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '..', 'client', 'dist');

  app.use(express.static(clientPath));

  // Express 5 rejects a bare '*', the wildcard has to be a named splat now
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

export default app;
