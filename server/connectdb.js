const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore';

async function connectToMongoDB() {
  console.log('Connecting to MongoDB...');
  console.log('Connection string:', MONGO_URI);
  
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout for this test
    });
    
    console.log('✅ MongoDB connection successful!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed!');
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nPossible reasons for connection failure:');
      console.log('1. MongoDB is not running');
      console.log('2. MongoDB is running on a different port');
      console.log('3. MongoDB connection string is incorrect');
      
      console.log('\nSuggestions:');
      console.log('1. Make sure MongoDB is installed and running');
      console.log('2. Check your connection string in .env file');
      console.log('3. Try using MongoDB Atlas (cloud) if local installation is problematic');
      console.log('4. Run the application with the local storage option: node server/localServer.js');
    }
    
    return false;
  } finally {
    // Disconnect after checking
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (err) {
      console.error('Error disconnecting from MongoDB:', err);
    }
  }
}

// If this script is run directly
if (require.main === module) {
  connectToMongoDB().then(success => {
    if (success) {
      console.log('\nYour MongoDB connection is working correctly!');
      console.log('You can now run your application with full functionality.');
    } else {
      console.log('\nPlease fix your MongoDB connection issues or use the local storage option.');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = connectToMongoDB; 