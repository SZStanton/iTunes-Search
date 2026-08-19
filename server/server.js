import app from './app.js';

// Kept apart from app.js so tests can import the app without it listening
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
