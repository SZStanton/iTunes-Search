import mongoose from 'mongoose';

// Called from server.js rather than app.js, so the tests can import the app
// without needing a database or credentials
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy server/.env.example to .env');
  }

  await mongoose.connect(uri);

  // The name is worth logging, since a URI missing it quietly uses 'test'
  console.log(`Connected to database: ${mongoose.connection.name}`);
}

export default connectDB;
