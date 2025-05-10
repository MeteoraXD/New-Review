const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const PremiumStatus = require('../models/PremiumStatus');
const Review = require('../models/Review');

const migrateData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB for migration');

    // Migrate premium accounts to PremiumStatus
    console.log('Migrating premium accounts...');
    const users = await User.find({ isPremium: true });
    
    for (const user of users) {
      try {
        // Check if PremiumStatus already exists
        const existingStatus = await PremiumStatus.findOne({ user: user._id });
        if (!existingStatus) {
          // Create new PremiumStatus
          const premiumStatus = new PremiumStatus({
            user: user._id,
            isActive: true,
            subscriptionType: 'monthly', // Default to monthly
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            status: 'active',
            features: {
              unlimitedReading: true,
              offlineAccess: true,
              prioritySupport: true
            }
          });
          await premiumStatus.save();
          console.log(`Created PremiumStatus for user ${user._id}`);
        }
      } catch (error) {
        console.error(`Error migrating premium status for user ${user._id}:`, error);
      }
    }

    // Migrate reviews
    console.log('Migrating reviews...');
    const books = await Book.find({ 'reviews.0': { $exists: true } });
    
    for (const book of books) {
      if (book.reviews && book.reviews.length > 0) {
        for (const review of book.reviews) {
          try {
            // Check if review already exists
            const existingReview = await Review.findOne({
              book: book._id,
              user: review.user
            });
            
            if (!existingReview) {
              // Create new Review
              const newReview = new Review({
                book: book._id,
                user: review.user,
                rating: review.rating || 0,
                comment: review.comment || '',
                status: 'approved',
                createdAt: review.date || new Date()
              });
              await newReview.save();
              console.log(`Created review for book ${book._id} by user ${review.user}`);
            }
          } catch (error) {
            console.error(`Error migrating review for book ${book._id}:`, error);
          }
        }
      }
    }

    console.log('Data migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
};

module.exports = migrateData; 