const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('./../server/models/User');
const { auth, authAdmin } = require('../middleware/auth');
const Book = require('./../server/models/Book');

// Register user
router.post('/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('role').isIn(['reader', 'author', 'admin']).withMessage('Invalid role')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, password, role } = req.body;

            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Create new user
            user = new User({
                name,
                email,
                password,
                role: role || 'reader' // Default to reader if no role specified
            });

            await user.save();

            // Create JWT token
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Login user
router.post('/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').exists().withMessage('Password is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password } = req.body;

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Create JWT token
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's favorite books
router.get('/favorites', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favoriteBooks');
        res.json(user.favoriteBooks);
    } catch (error) {
        console.error('Error fetching favorite books:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a book to favorites
router.post('/favorites/:bookId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const bookId = req.params.bookId;

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Check if book is already in favorites
        if (user.favoriteBooks.some(b => b.toString() === bookId)) {
            return res.status(400).json({ message: 'Book already in favorites' });
        }

        // Add book to favorites
        user.favoriteBooks.push(bookId);
        await user.save();

        res.json({ message: 'Book added to favorites' });
    } catch (error) {
        console.error('Error adding book to favorites:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove a book from favorites
router.delete('/favorites/:bookId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const bookId = req.params.bookId;

        // Remove book from favorites
        user.favoriteBooks = user.favoriteBooks.filter(id => id.toString() !== bookId);
        await user.save();

        res.json({ message: 'Book removed from favorites' });
    } catch (error) {
        console.error('Error removing book from favorites:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Routes

// Get all users (admin only)
router.get('/users', authAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user role (admin only)
router.put('/users/:userId/role', 
    [
        authAdmin,
        body('role').isIn(['reader', 'author', 'admin']).withMessage('Invalid role')
    ], 
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { role } = req.body;
            const userId = req.params.userId;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            user.role = role;
            await user.save();

            res.json({ message: 'User role updated successfully', user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }});
        } catch (error) {
            console.error('Error updating user role:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Delete user (admin only)
router.delete('/users/:userId', authAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.findByIdAndDelete(userId);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 