import express from 'express';
import Favourite from '../models/Favourite.js';
import { favouriteSchema } from '../validation/favouriteSchemas.js';

const router = express.Router();

// Every route here is mounted behind the auth middleware, so req.user is the
// person asking and nothing is ever looked up by an id the client supplied

//== LIST ==
router.get('/', async (req, res) => {
  const favourites = await Favourite.find({ user: req.user.id }).sort({
    createdAt: -1,
  });

  res.json({ favourites });
});

//== ADD ==
router.post('/', async (req, res) => {
  const parsed = favouriteSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'That result could not be saved.',
      errors: parsed.error.issues.map(issue => issue.message),
    });
  }

  try {
    const favourite = await Favourite.create({
      ...parsed.data,
      user: req.user.id,
    });

    res.status(201).json({ favourite });
  } catch (err) {
    // The compound index is what decides this, so let it rather than checking
    // first and leaving a gap between the check and the insert
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That is already a favourite.' });
    }

    throw err;
  }
});

//== REMOVE ==
router.delete('/:itemId', async (req, res) => {
  const itemId = Number(req.params.itemId);

  if (!Number.isInteger(itemId)) {
    return res.status(400).json({ message: 'That is not a valid item id.' });
  }

  // Scoped to the user, so a guessed id removes nothing from anyone else
  const removed = await Favourite.findOneAndDelete({
    user: req.user.id,
    itemId,
  });

  if (!removed) {
    return res
      .status(404)
      .json({ message: 'That is not one of your favourites.' });
  }

  res.json({ itemId });
});

export default router;
