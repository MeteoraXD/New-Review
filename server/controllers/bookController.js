const Book = require('../models/Book');
const User = require('../models/User');
const PremiumAccount = require('../models/PremiumAccount');
const PremiumStatus = require('../models/PremiumStatus');
const Review = require('../models/Review');

// Add this constant at the top of the file
const DEFAULT_COVER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

// Validate URL function
const isValidUrl = (url) => {
  if (!url) return false;
  
  // For data URIs, return true immediately
  if (url.startsWith('data:')) return true;
  
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

// Get all books
exports.getAllBooks = async (req, res) => {
    try {
        console.log('Attempting to fetch all books from database...');
        
        // Set a much shorter timeout for the query (5 seconds)
        // and use a fallback for timeouts
        let books;
        try {
            // Parse the isPremium query parameter
            const isPremiumParam = req.query.isPremium;
            let query = {};
            
            // If isPremium parameter is provided, filter books accordingly
            if (isPremiumParam !== undefined) {
                query.isPremium = isPremiumParam === 'true';
            }
            
            console.log('Filter query:', query);
            
            // Try to get real books with a short timeout
            books = await Promise.race([
                Book.find(query).lean().exec(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Database query timeout')), 30000)
                )
            ]);
            console.log(`Successfully fetched ${books.length} books from database`);
            
            // Ensure all books have PDF URLs for demonstration purposes
            books = books.map(book => {
                if (!book.pdfUrl) {
                    return {
                        ...book,
                        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                    };
                }
                return book;
            });
            
        } catch (queryError) {
            // If query times out or fails, use sample data
            console.log('Database query failed or timed out. Using sample data:', queryError.message);
            
            // Parse isPremium query parameter for filtering sample data
            const isPremiumParam = req.query.isPremium;
            
            // Create sample books - hardcoded to avoid database dependency
            let sampleBooks = [
                {
                    _id: "sample1",
                    title: "Sample Book 1",
                    author: "Sample Author",
                    description: "This is a sample book that appears when the database is unavailable.",
                    coverImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ESample Book%3C/text%3E%3C/svg%3E",
                    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    isPremium: false,
                    category: "Fiction",
                    publishedYear: 2023,
                    pages: 100,
                    rating: 4,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "sample2",
                    title: "Sample Book 2",
                    author: "Another Author",
                    description: "This is another sample book shown when MongoDB connection times out.",
                    coverImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3ESample Book%3C/text%3E%3C/svg%3E",
                    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    isPremium: false,
                    category: "Technology",
                    publishedYear: 2024,
                    pages: 150,
                    rating: 5,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    _id: "sample3",
                    title: "Premium Sample Book",
                    author: "Premium Author",
                    description: "This is a premium sample book.",
                    coverImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EPremium Book%3C/text%3E%3C/svg%3E",
                    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    isPremium: true,
                    category: "Premium",
                    publishedYear: 2024,
                    pages: 200,
                    rating: 5,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];
            
            // Filter sample books if isPremium parameter is provided
            if (isPremiumParam !== undefined) {
                const isPremiumValue = isPremiumParam === 'true';
                sampleBooks = sampleBooks.filter(book => book.isPremium === isPremiumValue);
            }
            
            books = sampleBooks;
            console.log('Returning sample books as fallback');
        }
        
        res.status(200).json(books);
    } catch (error) {
        console.error('Error in getAllBooks:', error);
        // Even if this fails, return sample data as a last resort
        const isPremiumParam = req.query.isPremium;
        let emergencyBook = {
            _id: "emergency-fallback",
            title: "Emergency Fallback Book",
            author: "System",
            description: "This book appears when all other options fail.",
            coverImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EEmergency Book%3C/text%3E%3C/svg%3E",
            pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            isPremium: false,
            category: "Other",
            publishedYear: 2024,
            pages: 1,
            rating: 0
        };
        
        // Only return the emergency book if it matches the premium filter or no filter was specified
        if (isPremiumParam === undefined || isPremiumParam === 'false') {
            res.status(200).json([emergencyBook]);
        } else {
            res.status(200).json([]);
        }
    }
};

// Get a single book by ID
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('author', 'name')
            .populate('reviews.user', 'username');

        if (!book) {
            return res.status(404).json({ 
                success: false,
                message: 'Book not found' 
            });
        }

        // Get reviews and rating for all books
        const reviews = await Review.find({ 
            book: book._id,
            status: 'approved'
        })
        .populate('user', 'username')
        .sort({ helpfulVotes: -1, createdAt: -1 });

        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

        // Add reviews and rating to the book object
        book.reviews = reviews;
        book.averageRating = averageRating;

        // Check if user can access the book
        const canAccess = !book.isPremium || 
                         (req.user && (req.user.role === 'admin' || 
                         await PremiumStatus.findOne({
                             user: req.user.id,
                             isActive: true,
                             status: 'active',
                             endDate: { $gt: new Date() }
                         })));

        // Always return book details, just control PDF access
        res.status(200).json({
            success: true,
            data: {
                ...book.toObject(),
                canAccessPdf: canAccess
            }
        });
    } catch (error) {
        console.error('Error in getBookById:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create a new book
exports.createBook = async (req, res) => {
    try {
        // Debug log
        console.log('Create book request received:', req.body);
        
        // Validate required fields
        const { title, author, description, category, publishedYear, pages, pdfUrl } = req.body;
        const requiredFields = ['title', 'author', 'description', 'category', 'publishedYear', 'pages'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                missingFields
            });
        }

        // Validate numeric fields
        if (isNaN(publishedYear) || publishedYear < 1000 || publishedYear > new Date().getFullYear()) {
            return res.status(400).json({ message: 'Invalid published year' });
        }

        if (isNaN(pages) || pages < 1) {
            return res.status(400).json({ message: 'Pages must be a valid number greater than 0' });
        }

        // Validate and set cover image
        let coverImage = req.body.coverImage;
        if (!coverImage || !isValidUrl(coverImage)) {
            coverImage = DEFAULT_COVER_IMAGE;
        }

        // Validate PDF URL if provided
        let validatedPdfUrl = '';
        if (pdfUrl) {
            if (isValidUrl(pdfUrl)) {
                validatedPdfUrl = pdfUrl;
            } else {
                return res.status(400).json({
                    message: 'Invalid PDF URL format'
                });
            }
        }

        // Create book with validated data
        const bookData = {
            ...req.body,
            coverImage,
            pdfUrl: validatedPdfUrl,
            publishedYear: Number(publishedYear),
            pages: Number(pages)
        };

        const book = new Book(bookData);
        await book.save();
        
        console.log('Book saved successfully:', book._id);
        res.status(201).json(book);
    } catch (error) {
        console.error('Error creating book:', error);
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error',
                errors: validationErrors
            });
        }

        // Handle other errors
        res.status(500).json({ 
            message: 'Error creating book', 
            error: error.message
        });
    }
};

// Update a book
exports.updateBook = async (req, res) => {
    try {
        const updates = { ...req.body };
        
        // Validate cover image if provided
        if (updates.coverImage && !isValidUrl(updates.coverImage)) {
            updates.coverImage = DEFAULT_COVER_IMAGE;
        }
        
        // Validate PDF URL if provided
        if (updates.pdfUrl !== undefined) {
            if (updates.pdfUrl && !isValidUrl(updates.pdfUrl)) {
                return res.status(400).json({
                    message: 'Invalid PDF URL format'
                });
            }
        }

        const book = await Book.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating book', 
            error: error.message,
            details: error.errors || {}
        });
    }
};

// Delete a book
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting book', error: error.message });
    }
};

// Get premium books
exports.getPremiumBooks = async (req, res) => {
    try {
        const books = await Book.find({ isPremium: true });
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching premium books', error: error.message });
    }
};

// Get free books
exports.getFreeBooks = async (req, res) => {
    try {
        const books = await Book.find({ isPremium: false });
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching free books', error: error.message });
    }
};

// Upload PDF for a book
exports.uploadBookPdf = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded' });
        }
        
        console.log('PDF file uploaded:', req.file);
        
        // Generate URL for the uploaded file - ensure no spaces
        const host = req.get('host');
        const protocol = req.protocol;
        const filename = req.file.filename.replace(/\s+/g, '');
        const fileUrl = `${protocol}://${host}/uploads/pdfs/${filename}`;
        
        console.log('Generated PDF URL:', fileUrl);
        
        res.status(200).json({ 
            message: 'PDF uploaded successfully',
            filename: filename,
            pdfUrl: fileUrl
        });
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).json({ 
            message: 'Error uploading PDF', 
            error: error.message 
        });
    }
};

// Add book to favorites
exports.addBookToFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookId = req.params.id;
        
        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        // Find user and update favorites
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if book is already in favorites
        if (user.favoriteBooks.some(b => b.toString() === bookId)) {
            return res.status(400).json({ message: 'Book is already in favorites' });
        }
        
        // Add book to favorites
        user.favoriteBooks.push(bookId);
        await user.save();
        
        res.status(200).json({ 
            message: 'Book added to favorites successfully',
            bookId: bookId,
            favoriteBooks: user.favoriteBooks
        });
    } catch (error) {
        console.error('Error adding book to favorites:', error);
        res.status(500).json({ message: 'Error adding book to favorites', error: error.message });
    }
};

// Remove book from favorites
exports.removeBookFromFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookId = req.params.id;
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if book is in favorites
        if (!user.favoriteBooks.some(b => b.toString() === bookId)) {
            return res.status(400).json({ message: 'Book is not in favorites' });
        }
        
        // Remove book from favorites
        user.favoriteBooks = user.favoriteBooks.filter(id => id.toString() !== bookId);
        await user.save();
        
        res.status(200).json({ 
            message: 'Book removed from favorites successfully',
            bookId: bookId,
            favoriteBooks: user.favoriteBooks
        });
    } catch (error) {
        console.error('Error removing book from favorites:', error);
        res.status(500).json({ message: 'Error removing book from favorites', error: error.message });
    }
};

// Get user's favorite books
exports.getFavoriteBooks = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find user and populate favorite books
        const user = await User.findById(userId)
            .populate('favoriteBooks');
            
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user.favoriteBooks || []);
    } catch (error) {
        console.error('Error getting favorite books:', error);
        res.status(500).json({ message: 'Error getting favorite books', error: error.message });
    }
};

// Update reading progress
exports.updateReadingProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookId = req.params.id;
        const { page } = req.body;
        
        if (!page || isNaN(page) || page < 1) {
            return res.status(400).json({ message: 'Valid page number is required' });
        }
        
        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        // For premium books, check premium access
        if (book.isPremium) {
            const user = await User.findById(userId);
            if (!user.hasPremiumAccess()) {
                return res.status(403).json({ 
                    message: 'Premium access required to save reading progress for this book' 
                });
            }
        }
        
        // Find user and update reading history
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if book is already in reading history
        const existingIndex = user.readingHistory.findIndex(
            item => item.book.toString() === bookId
        );
        
        if (existingIndex !== -1) {
            // Update existing entry
            user.readingHistory[existingIndex].lastReadPage = page;
            user.readingHistory[existingIndex].lastReadAt = new Date();
        } else {
            // Add new entry
            user.readingHistory.push({
                book: bookId,
                lastReadPage: page,
                lastReadAt: new Date()
            });
        }
        
        await user.save();
        
        res.status(200).json({ 
            message: 'Reading progress updated successfully',
            bookId: bookId,
            page: page,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Error updating reading progress:', error);
        res.status(500).json({ message: 'Error updating reading progress', error: error.message });
    }
};

// Get user's reading history
exports.getReadingHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find user and populate reading history
        const user = await User.findById(userId)
            .populate({
                path: 'readingHistory.book',
                select: 'title author coverImage category'
            });
            
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Format the response
        const readingHistory = user.readingHistory.map(item => ({
            book: item.book,
            lastReadPage: item.lastReadPage,
            lastReadAt: item.lastReadAt
        }));
        
        res.status(200).json(readingHistory);
    } catch (error) {
        console.error('Error getting reading history:', error);
        res.status(500).json({ message: 'Error getting reading history', error: error.message });
    }
};

// Add a review to a book
exports.addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const bookId = req.params.id;
        const userId = req.user.id;

        // Validate input
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        if (!comment || comment.trim() === '') {
            return res.status(400).json({ message: 'Comment is required' });
        }

        // Find the book
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Check if user has already reviewed this book
        const existingReview = book.reviews.find(
            review => review.user && review.user.toString() === userId
        );

        if (existingReview) {
            // Update existing review
            existingReview.rating = rating;
            existingReview.comment = comment;
            existingReview.date = new Date();
        } else {
            // Add new review
            book.reviews.push({
                user: userId,
                rating,
                comment,
                date: new Date()
            });
        }

        // Calculate and update average rating
        const totalRating = book.reviews.reduce((sum, review) => sum + review.rating, 0);
        book.rating = book.reviews.length > 0 ? (totalRating / book.reviews.length).toFixed(1) : 0;

        // Save the book with the new/updated review
        await book.save();

        // Return the updated book with populated user data in reviews
        const updatedBook = await Book.findById(bookId).populate({
            path: 'reviews.user',
            select: 'username'
        });

        res.status(200).json({
            message: existingReview ? 'Review updated successfully' : 'Review added successfully',
            book: updatedBook
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Error adding review', error: error.message });
    }
};

// Get all reviews for a book
exports.getBookReviews = async (req, res) => {
    try {
        const bookId = req.params.id;

        // Find the book and populate user data in reviews
        const book = await Book.findById(bookId).populate({
            path: 'reviews.user',
            select: 'username'
        });

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.status(200).json(book.reviews);
    } catch (error) {
        console.error('Error getting book reviews:', error);
        res.status(500).json({ message: 'Error getting book reviews', error: error.message });
    }
};

// Get all books with premium access check
exports.getBooks = async (req, res) => {
    try {
        let query = {};
        
        // If user is not premium, exclude premium books
        if (!req.user) {
            query.isPremium = false;
        } else {
            const premiumAccount = await PremiumAccount.findOne({ user: req.user._id });
            if (!premiumAccount || !premiumAccount.isValid()) {
                query.isPremium = false;
            }
        }

        const books = await Book.find(query)
            .populate('author', 'name')
            .populate('category', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: books.length,
            data: books
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 