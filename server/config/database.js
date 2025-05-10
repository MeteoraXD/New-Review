const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const PremiumStatus = require('../models/PremiumStatus');
const Review = require('../models/Review');

const setupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Create collections if they don't exist
    const collections = [
      { name: 'users', model: User },
      { name: 'books', model: Book },
      { name: 'premiumstatuses', model: PremiumStatus },
      { name: 'reviews', model: Review }
    ];

    for (const collection of collections) {
      try {
        await mongoose.connection.createCollection(collection.name);
        console.log(`Created collection: ${collection.name}`);
      } catch (error) {
        if (error.code !== 48) { // 48 is the code for "collection already exists"
          console.error(`Error creating collection ${collection.name}:`, error);
        }
      }
    }

    // Create indexes
    console.log('Creating indexes...');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ isPremium: 1 });

    // Book indexes
    await Book.collection.createIndex({ title: 'text', description: 'text' });
    await Book.collection.createIndex({ author: 1 });
    await Book.collection.createIndex({ category: 1 });
    await Book.collection.createIndex({ isPremium: 1 });

    // PremiumStatus indexes
    await PremiumStatus.collection.createIndex({ user: 1 }, { unique: true });
    await PremiumStatus.collection.createIndex({ endDate: 1 });
    await PremiumStatus.collection.createIndex({ status: 1 });
    await PremiumStatus.collection.createIndex({ isActive: 1 });

    // Review indexes
    await Review.collection.createIndex({ book: 1, user: 1 }, { unique: true });
    await Review.collection.createIndex({ book: 1, rating: 1 });
    await Review.collection.createIndex({ user: 1 });
    await Review.collection.createIndex({ status: 1 });
    await Review.collection.createIndex({ helpfulVotes: -1 });
    await Review.collection.createIndex({ createdAt: -1 });

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

module.exports = {
  setupDatabase
}; 