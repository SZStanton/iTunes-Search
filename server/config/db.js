import mongoose from 'mongoose';

// Called from server.js, not app.js, so tests can import the app without a
// database or credentials.
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy server/.env.example to .env');
  }

  await mongoose.connect(uri);

  // Worth logging, since a URI missing the name quietly uses 'test'.
  console.log(`Connected to database: ${mongoose.connection.name}`);
}

export default connectDB;
