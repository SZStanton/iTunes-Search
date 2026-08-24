import app from './app.js';
import { checkEnv } from './config/checkEnv.js';
import connectDB from './config/db.js';

// Kept apart from app.js so tests can import the app without it listening.
const PORT = process.env.PORT || 5000;

// Everything that is wrong at once, before anything tries to use it.
const { problems, warnings } = checkEnv();

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

if (problems.length) {
  console.error('Could not start the server:');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}

// Every request needs the database, so fail loudly rather than serve errors.
try {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (err) {
  console.error('Could not start the server:', err.message);
  process.exit(1);
}
