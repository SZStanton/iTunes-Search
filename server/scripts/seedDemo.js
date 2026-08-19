import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { resetDemoData } from '../config/demoSeed.js';

// Run with "npm run seed:demo -w server". Safe to rerun, it updates the account
// rather than making a second one

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const { MONGODB_URI, DEMO_EMAIL, DEMO_PASSWORD } = process.env;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Copy server/.env.example to .env');
  process.exit(1);
}

if (!DEMO_EMAIL || !DEMO_PASSWORD) {
  console.error(
    'DEMO_EMAIL and DEMO_PASSWORD are both needed to seed the demo',
  );
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
console.log(`Connected to database: ${mongoose.connection.name}`);

const email = DEMO_EMAIL.trim().toLowerCase();
const password = await bcrypt.hash(DEMO_PASSWORD, 10);

// Converting a real account into the shared public demo would hand out its
// password and wipe its data, so refuse rather than upsert blindly
const existing = await User.findOne({ email });

if (existing && !existing.isDemo) {
  console.error(`${email} is a registered account, not the demo.`);
  console.error('Pick a different DEMO_EMAIL, or delete that account first.');
  await mongoose.disconnect();
  process.exit(1);
}

// isDemo and no expiresAt are what keep it exempt from the retention sweep
const user = await User.findOneAndUpdate(
  { email },
  { $set: { email, password, isDemo: true }, $unset: { expiresAt: '' } },
  { upsert: true, returnDocument: 'after' },
);

// Changing DEMO_EMAIL would otherwise leave the old one flagged and immortal,
// and the login route picks whichever it finds first
const { modifiedCount } = await User.updateMany(
  { isDemo: true, _id: { $ne: user._id } },
  { $set: { isDemo: false, expiresAt: new Date() } },
);

if (modifiedCount) {
  console.log(`Retired ${modifiedCount} previous demo account(s).`);
}

await resetDemoData(user);

console.log(`Demo account ready: ${user.email}`);
console.log('Its favourites and searches reset on every demo login.');

await mongoose.disconnect();
