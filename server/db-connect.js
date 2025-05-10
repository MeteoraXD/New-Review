const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore';

console.log('Attempting to connect to MongoDB at:', MONGO_URI);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  // Keep the connection open for a moment to test
  setTimeout(() => {
    console.log('Closing connection...');
    mongoose.connection.close()
      .then(() => console.log('Connection closed'))
      .catch(err => console.error('Error closing connection:', err))
      .finally(() => process.exit(0));
  }, 3000);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Connection details:');
  console.error('- URI:', MONGO_URI);
  console.error('- Error code:', err.code);
  console.error('- Error name:', err.name);
  
  console.log('\nTroubleshooting tips:');
  console.log('1. Is MongoDB installed and running? Try: mongod --version');
  console.log('2. Check if MongoDB server is running locally');
  console.log('3. Check firewall settings');
  console.log('4. Verify correct connection string');
  
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
}); 