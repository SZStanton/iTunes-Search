import mongoose from 'mongoose';

// One row per remembered search. The list is capped, so these churn.
const searchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // As it was typed, since this is what gets shown back.
    term: { type: String, required: true, trim: true },
    // Lowercased copy, so "Beatles" and "beatles" are one search.
    termKey: { type: String, required: true, trim: true, lowercase: true },
    // The chip label rather than the API value, since a repeat puts it back
    // into the form.
    media: { type: String, trim: true, default: 'all' },
    // Mongo deletes the document once this passes. No date means never.
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true },
);

// A repeat moves the old row rather than adding one, so the pair is unique
// per person. Keyed on the lowercased term.
searchSchema.index({ user: 1, termKey: 1, media: 1 }, { unique: true });

export default mongoose.model('Search', searchSchema);
