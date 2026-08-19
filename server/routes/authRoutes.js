import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../validation/authSchemas.js';

const router = express.Router();

const TOKEN_LIFE = '7d';
const SALT_ROUNDS = 10;

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev-secret-key';

  return jwt.sign({ sub: user.id }, secret, { expiresIn: TOKEN_LIFE });
}

// The zod messages are what the form shows, so they go back as they are, keyed
// by field. Only the first per field, since a second rarely adds anything
function fieldErrors(error) {
  const errors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (!errors[field]) errors[field] = issue.message;
  }

  return errors;
}

function accountResponse(user) {
  return { token: signToken(user), user: { id: user.id, email: user.email } };
}

//== REGISTER ==
router.post('/register', async (req, res) => {
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
    const user = await User.create({ email, password: hash });

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
router.post('/login', async (req, res) => {
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

  res.json(accountResponse(user));
});

//== WHO AM I ==
// The client holds a token across reloads, and this says whether it still works
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});

export default router;
