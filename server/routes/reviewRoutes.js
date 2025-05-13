const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');
const { check, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Book = require('../models/Book');

// Validation middleware
const reviewValidation = [
    check('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    check('comment')
        .isLength({ min: 10, max: 500 })
        .withMessage('Comment must be between 10 and 500 characters'),
    check('bookId')
        .optional()
        .isMongoId()
        .withMessage('Invalid book ID format')
];

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Create a new review
router.post('/', 
    authenticateToken, 
    reviewValidation,
    handleValidationErrors,
    reviewController.createReview
);

// Get reviews for a book
router.get('/book/:bookId', reviewController.getBookReviews);

// Get all reviews (admin only)
router.get('/all', 
    authenticateToken,
    isAdmin,
    reviewController.getBookReviews
);

// Get pending reviews (admin only)
router.get('/pending',
    authenticateToken,
    isAdmin,
    async (req, res) => {
        try {
            const reviews = await Review.find({ status: 'pending' })
                .populate('user', 'username profilePicture')
                .populate('book', 'title author');
            
            res.status(200).json({
                success: true,
                data: reviews
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching pending reviews',
                error: error.message
            });
        }
    }
);

// Approve a review (admin only)
router.put('/:reviewId/approve',
    authenticateToken,
    isAdmin,
    async (req, res) => {
        try {
            const review = await Review.findById(req.params.reviewId);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found'
                });
            }

            review.status = 'approved';
            await review.save();

            // Update book rating
            const book = await Book.findById(review.book);
            const approvedReviews = await Review.find({ 
                book: review.book,
                status: 'approved'
            });
            
            const averageRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
            book.rating = averageRating || 0;
            await book.save();

            res.status(200).json({
                success: true,
                message: 'Review approved successfully',
                data: review
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error approving review',
                error: error.message
            });
        }
    }
);

// Update a review
router.put('/:reviewId', 
    authenticateToken, 
    reviewValidation,
    handleValidationErrors,
    reviewController.updateReview
);

// Delete a review
router.delete('/:reviewId', 
    authenticateToken, 
    reviewController.deleteReview
);

// Toggle like on a review
router.post('/:reviewId/like', 
    authenticateToken, 
    reviewController.toggleLike
);

// Get user's reviews
router.get('/user/:userId',
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.params.userId;
            
            // Users can only view their own reviews unless they're admin
            if (req.user.id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view these reviews'
                });
            }

            const reviews = await Review.find({ user: userId })
                .populate('book', 'title author coverImage')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                data: reviews
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching user reviews',
                error: error.message
            });
        }
    }
);

module.exports = router; 