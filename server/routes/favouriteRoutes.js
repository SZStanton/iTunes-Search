import express from 'express';
import Favourite from '../models/Favourite.js';
import { favouriteSchema } from '../validation/favouriteSchemas.js';
import { fieldErrors } from '../validation/fieldErrors.js';

const router = express.Router();

// Far more than anyone will save, but the free cluster is 512MB shared by every
// account, so the list cannot be unbounded
const MAX_FAVOURITES = 500;

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
      errors: fieldErrors(parsed.error),
    });
  }

  const saved = await Favourite.countDocuments({ user: req.user.id });

  if (saved >= MAX_FAVOURITES) {
    return res.status(409).json({
      message: `You can save up to ${MAX_FAVOURITES} favourites. Remove one to add another.`,
    });
  }

  try {
    // Inherits the account's expiry, so it is deleted alongside it rather than
    // being left behind pointing at a user that no longer exists
    const favourite = await Favourite.create({
      ...parsed.data,
      user: req.user.id,
      expiresAt: req.user.expiresAt,
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
