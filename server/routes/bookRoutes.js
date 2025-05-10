const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticateToken, isAdmin, isAuthorOrAdmin, isPremiumUser } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { check, validationResult } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const Book = require('../models/Book');
const Review = require('../models/Review');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/pdfs');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/free', bookController.getFreeBooks);
router.get('/premium', bookController.getPremiumBooks);
router.get('/:id', bookController.getBookById);

// File upload endpoint
router.post('/upload-pdf', authenticateToken, upload.single('pdf'), async (req, res) => {
  try {
    console.log('PDF upload request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    // Check if file was uploaded
    if (!req.file) {
      console.error('No PDF file in the request');
      return res.status(400).json({ 
        success: false,
        message: 'No PDF file uploaded' 
      });
    }
    
    console.log('PDF file uploaded:', req.file);
    
    // Generate URL for the uploaded file
    const host = req.get('host');
    const protocol = req.protocol;
    const filename = req.file.filename.replace(/\s+/g, '');
    const fileUrl = `/uploads/pdfs/${filename}`;
    
    console.log('Generated PDF URL:', fileUrl);
    
    // Ensure the PDF file is accessible
    const pdfPath = path.join(__dirname, '../uploads/pdfs', filename);
    
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF file not found at expected path: ${pdfPath}`);
      return res.status(500).json({
        success: false,
        message: 'PDF was uploaded but could not be found at the expected location',
        error: 'File not found after upload'
      });
    }
    
    console.log(`PDF file verified at: ${pdfPath}`);
    
    // If a bookId was provided, update the book with this PDF URL
    const bookId = req.body.bookId;
    if (bookId) {
      try {
        console.log(`Updating book ${bookId} with new PDF URL`);
        const Book = require('../models/Book');
        
        // Find the book by ID
        const book = await Book.findById(bookId);
        
        if (!book) {
          console.error(`Book not found: ${bookId}`);
          return res.status(404).json({ 
            success: false,
            message: 'Book not found',
            pdfUrl: fileUrl,
            filename: filename
          });
        }
        
        // Only allow authors of the book or admins to update it
        if (req.user.role !== 'admin' && 
            book.author.toString() !== req.user.userId && 
            req.user.role !== 'author') {
          console.error(`User ${req.user.userId} not authorized to update book ${bookId}`);
          return res.status(403).json({ 
            success: false,
            message: 'You are not authorized to update this book',
            pdfUrl: fileUrl,
            filename: filename
          });
        }
        
        // Update the book with the new PDF URL
        book.pdfUrl = fileUrl;
        await book.save();
        
        console.log(`Updated book ${bookId} with new PDF URL: ${fileUrl}`);
        
        // Also create a named copy of the file for easier management
        try {
          const sourcePath = path.join(__dirname, '../uploads/pdfs', filename);
          const destPath = path.join(__dirname, '../uploads/pdfs', `${bookId}.pdf`);
          
          // Create a copy with the book ID as the filename
          fs.copyFile(sourcePath, destPath, (err) => {
            if (err) console.error(`Error creating named PDF copy: ${err}`);
            else console.log(`Created named PDF copy at ${destPath}`);
          });
        } catch (copyError) {
          console.error('Error creating named PDF copy:', copyError);
        }
        
        return res.status(200).json({ 
          success: true,
          message: 'PDF uploaded and book updated successfully',
          book: book,
          filename: filename,
          pdfUrl: fileUrl
        });
      } catch (bookError) {
        console.error('Error updating book with PDF:', bookError);
        
        // Return the PDF URL even if book update failed
        return res.status(200).json({ 
          success: true,
          message: 'PDF uploaded but failed to update book',
          error: bookError.message,
          filename: filename,
          pdfUrl: fileUrl
        });
      }
    }
    
    // If no bookId was provided or updating the book failed, just return the uploaded file info
    res.status(200).json({ 
      success: true,
      message: 'PDF uploaded successfully',
      filename: filename,
      pdfUrl: fileUrl
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error uploading PDF', 
      error: error.message 
    });
  }
});

// Protected routes - require authentication
router.post('/', authenticateToken, isAuthorOrAdmin, bookController.createBook);
router.put('/:id', authenticateToken, isAuthorOrAdmin, bookController.updateBook);
router.delete('/:id', authenticateToken, isAdmin, bookController.deleteBook);

// Favorites routes
router.post('/:id/favorites', authenticateToken, bookController.addBookToFavorites);
router.delete('/:id/favorites', authenticateToken, bookController.removeBookFromFavorites);
router.get('/user/favorites', authenticateToken, bookController.getFavoriteBooks);

// Reading history routes
router.post('/:id/reading-progress', authenticateToken, bookController.updateReadingProgress);
router.get('/user/reading-history', authenticateToken, bookController.getReadingHistory);

// Review routes
router.post('/:id/reviews', authenticateToken, async (req, res) => {
    try {
        console.log('Review submission request received:', {
            bookId: req.params.id,
            userId: req.user.userId,
            body: req.body
        });

        const { rating, comment } = req.body;
        const bookId = req.params.id;
        const userId = req.user.userId;

        // Validate user ID
        if (!userId) {
            console.error('No user ID found in request');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Basic validation
        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Rating and comment are required'
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

        // Find the book
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

        // Create new review
        const reviewData = {
            user: userId,
            book: bookId,
            rating: parseInt(rating),
            comment: comment.trim(),
            status: 'approved',
            date: new Date()
        };

        console.log('Creating review with data:', reviewData);

        const review = new Review(reviewData);

        // Save the review
        try {
            const savedReview = await review.save();
            console.log('Review saved successfully:', savedReview);

            // Get all approved reviews for this book
            const reviews = await Review.find({ book: bookId, status: 'approved' })
                .populate('user', 'username profilePicture');

            // Calculate new average rating
            const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            
            // Update book's average rating
            book.rating = averageRating;
            await book.save();

            // Return the newly created review with user data
            const populatedReview = await Review.findById(savedReview._id)
                .populate('user', 'username profilePicture');

            res.status(201).json({
                success: true,
                message: 'Review added successfully',
                data: populatedReview
            });
        } catch (saveError) {
            console.error('Error saving review:', saveError);
            return res.status(500).json({
                success: false,
                message: 'Error saving review',
                error: saveError.message
            });
        }
    } catch (error) {
        console.error('Error in review submission:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creating review',
            error: error.message
        });
    }
});

router.get('/:id/reviews', async (req, res) => {
    try {
        const { id: bookId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const reviews = await Review.find({ 
            book: bookId,
            status: 'approved'
        })
        .populate('user', 'username')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit);

        const totalReviews = await Review.countDocuments({ 
            book: bookId,
            status: 'approved'
        });

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
});

// Add this new route for direct PDF streaming with appropriate headers
router.get('/pdf-stream/:bookId', authenticateToken, async (req, res) => {
  const { bookId } = req.params;
  
  try {
    // Find the book to get the PDF URL
    const Book = require('../models/Book');
    const User = require('../models/User');
    
    const book = await Book.findById(bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if user can access premium content
    if (book.isPremium && (!req.user || req.user.role !== 'admin')) {
      const user = await User.findById(req.user.id);
      if (!user || !user.isPremium) {
        return res.status(403).json({ message: 'Premium subscription required to access this content' });
      }
    }
    
    // Get the PDF path - handle both relative and absolute paths
    const pdfPath = book.pdfUrl.startsWith('/') 
      ? path.join(__dirname, '..', 'public', book.pdfUrl)
      : path.join(__dirname, '..', book.pdfUrl);
    
    // Set proper headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${book.title.replace(/[^a-zA-Z0-9.]/g, '_')}.pdf"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    // Handle errors in the stream
    fileStream.on('error', (error) => {
      console.error('Error streaming PDF:', error);
      
      // Check if headers have already been sent
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming PDF file' });
      }
    });
  } catch (error) {
    console.error('Error in PDF streaming route:', error);
    res.status(500).json({ message: 'Server error while streaming PDF' });
  }
});

module.exports = router; 