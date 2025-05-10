const Review = require('../models/Review');
const Book = require('../models/Book');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new review
exports.createReview = async (req, res) => {
    try {
        const { bookId, rating, comment } = req.body;
        const userId = req.user.id || req.user.userId; // Handle both formats

        // Validate input
        if (!bookId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Book ID, rating, and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        if (comment.length < 10 || comment.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Comment must be between 10 and 500 characters'
            });
        }

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check if user has already reviewed this book
        const existingReview = await Review.findOne({ user: userId, book: bookId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this book'
            });
        }

        // Check if user exists and get premium status
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Determine premium status
        const isPremium = user.isPremium || (typeof user.hasPremiumAccess === 'function' && user.hasPremiumAccess());

        // Create new review
        const review = new Review({
            user: userId,
            book: bookId,
            rating,
            comment: comment.trim(),
            status: isPremium ? 'approved' : 'pending',
            isVerifiedPurchase: isPremium
        });

        await review.save();

        // Update book's average rating
        const reviews = await Review.find({ book: bookId, status: 'approved' });
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        book.rating = averageRating || 0; // Handle case when there are no reviews
        await book.save();

        // Populate user data in response
        const populatedReview = await Review.findById(review._id)
            .populate('user', 'username profilePicture');

        res.status(201).json({
            success: true,
            message: isPremium ? 'Review submitted and approved' : 'Review submitted and pending approval',
            data: populatedReview
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating review',
            error: error.message
        });
    }
};

// Get reviews for a book
exports.getBookReviews = async (req, res) => {
    try {
        const { bookId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        // Get approved reviews with pagination
        const reviews = await Review.find({ 
            book: bookId,
            status: 'approved'
        })
        .populate('user', 'username profilePicture')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit);

        // Get total count for pagination
        const totalReviews = await Review.countDocuments({ 
            book: bookId,
            status: 'approved'
        });

        // Calculate average rating
        const averageRating = await Review.aggregate([
            { $match: { book: bookId, status: 'approved' } },
            { $group: { _id: null, average: { $avg: '$rating' } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                reviews,
                pagination: {
                    total: totalReviews,
                    page,
                    pages: Math.ceil(totalReviews / limit)
                },
                averageRating: averageRating[0]?.average || 0
            }
        });
    } catch (error) {
        console.error('Error getting book reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting book reviews',
            error: error.message
        });
    }
};

// Update a review
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.userId;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user is the owner or admin
        if (review.user.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }

        // Update review
        if (rating) review.rating = rating;
        if (comment) review.comment = comment.trim();
        review.isEdited = true;

        await review.save();

        // Update book's average rating
        const book = await Book.findById(review.book);
        const reviews = await Review.find({ book: review.book, status: 'approved' });
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        book.rating = averageRating;
        await book.save();

        // Populate user data in response
        const populatedReview = await Review.findById(review._id)
            .populate('user', 'username profilePicture');

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: populatedReview
        });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating review',
            error: error.message
        });
    }
};

// Delete a review
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.userId;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user is the owner or admin
        if (review.user.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        // Delete the review
        await review.remove();

        // Update book's average rating
        const book = await Book.findById(review.book);
        const reviews = await Review.find({ book: review.book, status: 'approved' });
        const averageRating = reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0;
        
        book.rating = averageRating;
        await book.save();

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting review',
            error: error.message
        });
    }
};

// Toggle like on a review
exports.toggleLike = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.userId;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user has already liked the review
        const likeIndex = review.likes.indexOf(userId);
        if (likeIndex === -1) {
            // Add like
            review.likes.push(userId);
            // Remove dislike if exists
            const dislikeIndex = review.dislikes.indexOf(userId);
            if (dislikeIndex !== -1) {
                review.dislikes.splice(dislikeIndex, 1);
            }
        } else {
            // Remove like
            review.likes.splice(likeIndex, 1);
        }

        await review.save();

        res.status(200).json({
            success: true,
            message: 'Like toggled successfully',
            data: {
                likes: review.likes.length,
                dislikes: review.dislikes.length
            }
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling like',
            error: error.message
        });
    }
}; 