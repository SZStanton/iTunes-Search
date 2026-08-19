import express from 'express';
import Search from '../models/Search.js';
import { historySchema } from '../validation/searchSchemas.js';

const router = express.Router();

// Long enough to be useful, short enough to sit under the search bar
const HISTORY_LIMIT = 10;

// Mounted behind the auth middleware, so req.user is the person asking

//== LIST ==
router.get('/', async (req, res) => {
  const searches = await Search.find({ user: req.user.id })
    .sort({ updatedAt: -1 })
    .limit(HISTORY_LIMIT);

  res.json({ searches });
});

//== RECORD ==
router.post('/', async (req, res) => {
  const parsed = historySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'That search could not be remembered.',
      errors: parsed.error.issues.map(issue => issue.message),
    });
  }

  const { term, media } = parsed.data;

  // Searching the same thing again moves it to the top rather than adding a
  // second row, which is why the upsert matches on the pair
  const search = await Search.findOneAndUpdate(
    { user: req.user.id, term, media },
    { $set: { user: req.user.id, term, media } },
    { upsert: true, returnDocument: 'after', timestamps: true },
  );

  // Drop anything past the limit, oldest first
  const stale = await Search.find({ user: req.user.id })
    .sort({ updatedAt: -1 })
    .skip(HISTORY_LIMIT)
    .select('_id');

  if (stale.length) {
    await Search.deleteMany({ _id: { $in: stale.map(doc => doc._id) } });
  }

  res.status(201).json({ search });
});

//== REMOVE ONE ==
router.delete('/:id', async (req, res) => {
  const removed = await Search.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  }).catch(() => null);

  if (!removed) {
    return res
      .status(404)
      .json({ message: 'That is not one of your searches.' });
  }

  res.json({ id: req.params.id });
});

//== CLEAR ==
router.delete('/', async (req, res) => {
  const { deletedCount } = await Search.deleteMany({ user: req.user.id });

  res.json({ removed: deletedCount });
});

export default router;
