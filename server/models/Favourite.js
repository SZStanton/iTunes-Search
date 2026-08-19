import mongoose from 'mongoose';

// A saved result. The display fields are copied in rather than looked up again,
// so a favourite still renders if iTunes stops returning that item
const favouriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // A track's own id where there is one, the collection's for an album result
    itemId: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, trim: true, default: '' },
    artwork: { type: String, trim: true, default: '' },
    releaseDate: { type: Date },
    kind: { type: String, trim: true, default: '' },
    // Mongo deletes the document once this passes. No date means never
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true },
);

// One row per item per person, decided by the database rather than by a check
// that leaves a gap between reading and writing
favouriteSchema.index({ user: 1, itemId: 1 }, { unique: true });

export default mongoose.model('Favourite', favouriteSchema);
