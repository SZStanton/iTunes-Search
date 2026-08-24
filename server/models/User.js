import mongoose from 'mongoose';

// Login details only. No display name, no handle.
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    // Mongo deletes the document once this passes. No date means never, which
    // is how the demo account is exempt without a special case.
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
    // The shared account whose data resets on login. Never expires.
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
