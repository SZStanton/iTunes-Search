import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';
import { apiLimiter, authLimiter } from '../middleware/rateLimits.js';
import { resetDemoData } from '../config/demoSeed.js';
import { jwtSecret } from '../config/jwtSecret.js';
import { expiryFromNow, touchAccount } from '../config/retention.js';
import { loginSchema, registerSchema } from '../validation/authSchemas.js';
import { fieldErrors } from '../validation/fieldErrors.js';

const router = express.Router();

const TOKEN_LIFE = '7d';
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ sub: user.id }, jwtSecret(), { expiresIn: TOKEN_LIFE });
}

function accountResponse(user) {
  return { token: signToken(user), user: { id: user.id, email: user.email } };
}

//== REGISTER ==
router.post('/register', authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Please check the details you entered.',
      errors: fieldErrors(parsed.error),
    });
  }

  const { email, password } = parsed.data;
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    // Dated from the start, so an account that is registered and never used
    // still gets cleaned up
    const user = await User.create({
      email,
      password: hash,
      expiresAt: expiryFromNow(),
    });

    res.status(201).json(accountResponse(user));
  } catch (err) {
    // The unique index is what actually decides this, so let it, rather than
    // checking first and leaving a gap between the check and the insert
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'That email is already registered.',
        errors: { email: 'That email is already registered.' },
      });
    }

    throw err;
  }
});

//== LOGIN ==
router.post('/login', authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Please check the details you entered.',
      errors: fieldErrors(parsed.error),
    });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });

  // Same answer whether the email is unknown or the password is wrong, or this
  // becomes a way to find out who has an account
  const matches = user && (await bcrypt.compare(password, user.password));

  if (!matches) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }

  // Logging in is activity, so the clock restarts here as well as on a request
  await touchAccount(user);

  res.json(accountResponse(user));
});

//== DEMO ==
// One click on the login page, so nobody has to hand over an email to look round
router.post('/demo', authLimiter, async (req, res) => {
  const user = await User.findOne({ isDemo: true });

  if (!user) {
    return res.status(503).json({
      message: 'The demo account is not set up on this server.',
    });
  }

  // Whatever the last visitor added or deleted goes, so everyone starts the same
  await resetDemoData(user);

  res.json(accountResponse(user));
});

//== WHO AM I ==
// The client holds a token across reloads, and this says whether it still works
router.get('/me', apiLimiter, authenticateToken, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});

export default router;
