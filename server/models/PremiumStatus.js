const mongoose = require('mongoose');

const premiumStatusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  subscriptionType: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  lastChecked: {
    type: Date,
    default: Date.now
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
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for faster queries
premiumStatusSchema.index({ user: 1 });
premiumStatusSchema.index({ endDate: 1 });
premiumStatusSchema.index({ status: 1 });

// Method to check if subscription is valid
premiumStatusSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && 
         this.status === 'active' && 
         now >= this.startDate && 
         now <= this.endDate;
};

// Method to update last checked timestamp
premiumStatusSchema.methods.updateLastChecked = async function() {
  this.lastChecked = new Date();
  await this.save();
};

const PremiumStatus = mongoose.model('PremiumStatus', premiumStatusSchema);

module.exports = PremiumStatus; 