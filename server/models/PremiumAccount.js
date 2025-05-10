const mongoose = require('mongoose');

const premiumAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  subscriptionType: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  features: {
    unlimitedReading: {
      type: Boolean,
      default: true
    },
    offlineAccess: {
      type: Boolean,
      default: true
    },
    prioritySupport: {
      type: Boolean,
      default: true
    }
  },
  paymentHistory: [{
    amount: Number,
    date: Date,
    transactionId: String,
    status: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
premiumAccountSchema.index({ user: 1 });
premiumAccountSchema.index({ endDate: 1 });

// Method to check if subscription is valid
premiumAccountSchema.methods.isValid = function() {
  return this.isActive && 
         this.status === 'active' && 
         this.endDate > new Date();
};

// Method to calculate remaining days
premiumAccountSchema.methods.getRemainingDays = function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const PremiumAccount = mongoose.model('PremiumAccount', premiumAccountSchema);

module.exports = PremiumAccount; 