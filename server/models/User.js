const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['reader', 'author', 'admin'],
        default: 'reader'
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumExpiry: {
        type: Date,
        default: null
    },
    favoriteBooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    }],
    readingHistory: [{
        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book'
        },
        lastReadPage: {
            type: Number,
            default: 1
        },
        lastReadAt: {
            type: Date,
            default: Date.now
        }
    }],
    profilePicture: {
        type: String,
        default: ''
    },
    paymentMethods: [{
        type: {
            type: String,
            enum: ['bank_transfer', 'khalti', 'other'],
            required: true
        },
        bankName: String,
        accountName: String,
        accountNumber: String, 
        contactNumber: String,
        lastUsed: {
            type: Date,
            default: Date.now
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    subscriptionHistory: [{
        planId: String,
        amount: Number,
        method: String,
        transactionId: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'approved'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Method to check if user has premium access
userSchema.methods.hasPremiumAccess = function() {
    try {
        // First check if isPremium is set
        if (!this.isPremium) return false;
        
        // If premium but no expiry date (unlimited premium)
        if (!this.premiumExpiry) return true;
        
        // Check if premium subscription is still valid
        return new Date() < new Date(this.premiumExpiry);
    } catch (error) {
        console.error('Error in hasPremiumAccess:', error);
        return false; // Default to no premium access on error
    }
};

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 