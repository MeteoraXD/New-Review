const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['bank_transfer', 'khalti', 'other'],
        required: true
    },
    bankName: {
        type: String,
        required: function() {
            return this.type === 'bank_transfer';
        }
    },
    accountName: {
        type: String,
        required: function() {
            return this.type === 'bank_transfer';
        }
    },
    accountNumber: {
        type: String,
        required: function() {
            return this.type === 'bank_transfer';
        }
    },
    contactNumber: {
        type: String,
        required: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for faster queries
paymentMethodSchema.index({ userId: 1, type: 1 });
paymentMethodSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema); 