const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
console.log('Loading environment variables...');
dotenv.config({ path: path.join(__dirname, '../.env') });  // Look in parent directory
dotenv.config({ path: path.join(__dirname, '.env') });     // Also look in server directory

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore';

console.log('Attempting to connect to MongoDB using:');
console.log('MONGODB_URI from env:', process.env.MONGODB_URI ? 'Found' : 'Not found');
console.log('Fallback URI:', 'mongodb://localhost:27017/bookstore');

// Attempt connection
console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('Connection details:');
  console.log('- URI:', MONGODB_URI);
  console.log('- Database name:', mongoose.connection.name);
  // Close the connection
  setTimeout(() => {
    mongoose.connection.close()
      .then(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
  }, 2000);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Connection details:');
  console.error('- URI:', MONGODB_URI);
  console.error('- Error code:', err.code);
  console.error('- Error name:', err.name);
  process.exit(1);
}); 