const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        default: ''
    },
    pdfUrl: {
        type: String,
        default: ''
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        required: true,
        enum: ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Other']
    },
    publishedYear: {
        type: Number,
        required: true
    },
    pages: {
        type: Number,
        required: true,
        min: 1
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: Number,
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Book', bookSchema); 