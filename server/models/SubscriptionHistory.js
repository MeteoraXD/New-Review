const mongoose = require('mongoose');

const subscriptionHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: true
    },
    planType: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'NPR'
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
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'pending'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentDetails: {
        transactionId: String,
        paymentGateway: String,
        paymentDate: Date,
        receiptUrl: String
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for faster queries
subscriptionHistorySchema.index({ userId: 1, status: 1 });
subscriptionHistorySchema.index({ userId: 1, startDate: -1 });
subscriptionHistorySchema.index({ paymentMethodId: 1 });

// Virtual field for remaining days
subscriptionHistorySchema.virtual('remainingDays').get(function() {
    if (this.status !== 'active') return 0;
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - now);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('SubscriptionHistory', subscriptionHistorySchema); 