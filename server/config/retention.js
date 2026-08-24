import Favourite from '../models/Favourite.js';
import Search from '../models/Search.js';

// How long an account survives unused. Follows use rather than signup.
const RETENTION_DAYS = 60;

// Rewriting three collections per request would be wasteful, so the date only
// moves once it has drifted by more than this.
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

function expiryFromNow() {
  return new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

// Push the expiry out for an account and everything it owns. The demo has no
// date, and a document with no date is never deleted.
async function touchAccount(user) {
  if (user.isDemo) return;

  const target = expiryFromNow();
  const current = user.expiresAt?.getTime() ?? 0;

  if (target.getTime() - current < REFRESH_AFTER_MS) return;

  user.expiresAt = target;
  await user.save();

  // timestamps: false matters. Mongoose writes updatedAt on an updateMany,
  // flattening the order the history list and its trim depend on.
  await Promise.all([
    Favourite.updateMany(
      { user: user.id },
      { $set: { expiresAt: target } },
      { timestamps: false },
    ),
    Search.updateMany(
      { user: user.id },
      { $set: { expiresAt: target } },
      { timestamps: false },
    ),
  ]);
}

export { RETENTION_DAYS, expiryFromNow, touchAccount };
