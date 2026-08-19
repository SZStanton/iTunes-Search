import mongoose from 'mongoose';

// One row per remembered search. The list is capped, so these are written and
// dropped constantly rather than kept forever
const searchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    term: { type: String, required: true, trim: true },
    // The dropdown label rather than the API value, since it goes straight back
    // into the select when someone re-runs a search
    media: { type: String, trim: true, default: 'all' },
    // Mongo deletes the document once this passes. No date means never
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true },
);

// Searching the same thing twice moves the old row rather than adding one, so
// the pair has to be unique per person
searchSchema.index({ user: 1, term: 1, media: 1 }, { unique: true });

export default mongoose.model('Search', searchSchema);
