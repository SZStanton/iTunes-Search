import app from './app.js';
import connectDB from './config/db.js';

// Kept apart from app.js so tests can import the app without it listening
const PORT = process.env.PORT || 5000;

// No point serving requests that all need the database, so fail loudly instead
try {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (err) {
  console.error('Could not start the server:', err.message);
  process.exit(1);
}
