const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, checkRole } = require('../middleware/auth');
const Book = require('../models/Book');

// Get all books
router.get('/', async (req, res) => {
    try {
        const books = await Book.find().populate('author', 'name');
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get book by ID
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('author', 'name');
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new book (admin or author)
router.post('/', auth, async (req, res) => {
    try {
        // Only authors can add books
        // if (req.user.role !== 'author') {
        //     return res.status(403).json({ message: 'Only authors can add books' });
        // }

        const book = new Book({
            ...req.body,
            author: req.user.id
        });

        await book.save();
        res.status(201).json(book);
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update book (admin or book author)
router.put('/:id', auth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Only the author can update their own books
        if (book.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this book' });
        }

        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedBook);
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete book (admin or book author)
router.delete('/:id', auth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Only the author can delete their own books
        if (book.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this book' });
        }

        await book.remove();
        res.json({ message: 'Book removed' });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add review to book
router.post('/:id/reviews', auth, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        const review = {
            user: req.user._id,
            rating: req.body.rating,
            comment: req.body.comment
        };
        
        book.reviews.push(review);
        await book.save();
        
        res.status(201).json(book);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get total book count
router.get('/count', async (req, res) => {
    try {
        const count = await Book.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error counting books:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 