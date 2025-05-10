const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  helpfulVotes: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
reviewSchema.index({ book: 1, user: 1 }, { unique: true });
reviewSchema.index({ book: 1, rating: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ status: 1 });

// Method to calculate review score
reviewSchema.methods.calculateScore = function() {
  return this.helpfulVotes - (this.reportCount * 2);
};

// Method to check if review is from a premium user
reviewSchema.methods.isFromPremiumUser = async function() {
  const PremiumStatus = mongoose.model('PremiumStatus');
  const premiumStatus = await PremiumStatus.findOne({ 
    user: this.user,
    isActive: true,
    status: 'active'
  });
  return !!premiumStatus;
};

// Method to mark review as verified purchase
reviewSchema.methods.markAsVerifiedPurchase = async function() {
  this.isVerifiedPurchase = true;
  await this.save();
};

// Method to check if user has already reviewed the book
reviewSchema.statics.hasUserReviewed = async function(userId, bookId) {
  return await this.findOne({ user: userId, book: bookId });
};

// Method to calculate average rating for a book
reviewSchema.statics.getAverageRating = async function(bookId) {
  const result = await this.aggregate([
    { $match: { book: bookId } },
    { $group: { _id: null, averageRating: { $avg: '$rating' } } }
  ]);
  
  return result[0]?.averageRating || 0;
};

// Method to get total reviews for a book
reviewSchema.statics.getTotalReviews = async function(bookId) {
  return await this.countDocuments({ book: bookId });
};

// Method to get rating distribution for a book
reviewSchema.statics.getRatingDistribution = async function(bookId) {
  return await this.aggregate([
    { $match: { book: bookId } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 