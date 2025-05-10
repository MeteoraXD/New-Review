const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const dotenv = require('dotenv');

// Load environment variables - first check local .env file
console.log('Loading environment variables...');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log(`Server will run on port ${PORT}`);
console.log('Running in local mode with JSON storage instead of MongoDB');

// Set up upload middleware
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads/pdfs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create clean filename without spaces
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`.replace(/\s+/g, '');
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors({
  origin: '*', // Allow all origins temporarily for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests with wildcard
app.options('*', cors({ origin: '*' }));

// Add more verbose logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    console.log(`Serving file: ${filePath}`);
    if (filePath.endsWith('.pdf')) {
      // Set proper headers for PDFs
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + path.basename(filePath) + '"');
      // CORS headers - allow from any origin
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Accept');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, Accept-Ranges');
      // Cache headers
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    }
  },
  fallthrough: true // Allow the next middleware to handle the request if the file is not found
}));

// Special route to serve sample PDF when a requested PDF is not found
app.get('/uploads/pdfs/:filename', (req, res, next) => {
  const requestedFilePath = path.join(__dirname, 'uploads/pdfs', req.params.filename);
  
  // If the file exists, let the static middleware handle it
  if (fs.existsSync(requestedFilePath)) {
    return next();
  }
  
  console.log(`PDF file not found: ${requestedFilePath}, serving default sample`);
  
  // Check if we have the sample PDF
  const samplePath = path.join(__dirname, 'uploads/pdfs/sample.pdf');
  if (fs.existsSync(samplePath)) {
    // Set PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="sample.pdf"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send the sample PDF
    return fs.createReadStream(samplePath).pipe(res);
  }
  
  // If no sample, create a text response about the missing PDF
  res.setHeader('Content-Type', 'text/plain');
  res.status(404).send(`The requested PDF "${req.params.filename}" was not found on the server.`);
});

// Ensure uploads directory exists and create a sample PDF if none exists
const ensureUploadsAndSamplePdf = () => {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, 'uploads/pdfs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at', uploadDir);
  }
  
  // Check if there's a sample.pdf, if not create one
  const samplePath = path.join(__dirname, 'uploads/pdfs/sample.pdf');
  if (!fs.existsSync(samplePath)) {
    try {
      // Create a very basic PDF file directly
      const samplePdfContent = `%PDF-1.4
1 0 obj
<</Type /Catalog /Pages 2 0 R>>
endobj
2 0 obj
<</Type /Pages /Kids [3 0 R] /Count 1>>
endobj
3 0 obj
<</Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 6 0 R>>
endobj
4 0 obj
<</Font <</F1 5 0 R>>>>
endobj
5 0 obj
<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>
endobj
6 0 obj
<</Length 44>>
stream
BT /F1 24 Tf 175 700 Td (BookSansar Sample PDF) Tj ET
BT /F1 14 Tf 150 650 Td (This PDF is provided as a fallback) Tj ET
BT /F1 14 Tf 120 620 Td (when the requested PDF could not be found.) Tj ET
endstream
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000111 00000 n
0000000212 00000 n
0000000250 00000 n
0000000317 00000 n
trailer
<</Size 7 /Root 1 0 R>>
startxref
406
%%EOF`;
      
      fs.writeFileSync(samplePath, samplePdfContent);
      console.log('Created sample PDF at', samplePath);
    } catch (err) {
      console.error('Failed to create sample PDF:', err);
    }
  }
};

// Simple upload endpoint
app.post('/upload', upload.single('pdf'), (req, res) => {
  console.log('Upload request received');
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  
  try {
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No PDF file uploaded' 
      });
    }
    
    console.log('Simple upload received file:', req.file.originalname);
    
    // Generate clean URL for the uploaded file
    const host = req.get('host');
    const protocol = req.protocol;
    const filename = req.file.filename.replace(/\s+/g, '');
    const fileUrl = `${protocol}://${host}/uploads/pdfs/${filename}`;
    
    console.log('Generated PDF URL:', fileUrl);
    
    return res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      filename: filename,
      pdfUrl: fileUrl
    });
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during upload',
      error: error.message 
    });
  }
});

// Create a data directory for local data storage
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('Created data directory at', DATA_DIR);
}

// Routes
const localAuthRoutes = require('./routes/localAuthRoutes');
app.use('/api/auth', localAuthRoutes);

// Use bookRoutes for book-related endpoints
const bookRoutes = require('./routes/bookRoutes');
app.use('/api/books', bookRoutes);

// Custom middleware for handling book routes
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');

// Replace the placeholder image URLs with data URI SVGs
const FREE_BOOK_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='200' viewBox='0 0 150 200'%3E%3Crect width='150' height='200' fill='%233498db'/%3E%3Crect x='5' y='5' width='140' height='190' fill='%233498db' stroke='%23ffffff' stroke-width='2'/%3E%3Ctext x='75' y='100' font-family='Arial' font-size='14' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3EFree Book%3C/text%3E%3C/svg%3E";

const PREMIUM_BOOK_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='200' viewBox='0 0 150 200'%3E%3Crect width='150' height='200' fill='%23f39c12'/%3E%3Crect x='5' y='5' width='140' height='190' fill='%23f39c12' stroke='%23ffffff' stroke-width='2'/%3E%3Ctext x='75' y='100' font-family='Arial' font-size='14' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3EPremium Book%3C/text%3E%3C/svg%3E";

// Helper functions for book data
const getBooks = () => {
  try {
    if (!fs.existsSync(BOOKS_FILE)) {
      // Create sample books if file doesn't exist
      const sampleBooks = [
        {
          _id: 'book1',
          title: 'Sample Free Book',
          author: 'Jane Doe',
          description: 'A free book for everyone to enjoy',
          coverImage: FREE_BOOK_PLACEHOLDER,
          pdfUrl: '/uploads/pdfs/sample.pdf',
          category: 'Fiction',
          publishedYear: 2023,
          pages: 200,
          isPremium: false,
          createdAt: new Date().toISOString()
        },
        {
          _id: 'book2',
          title: 'Premium Content',
          author: 'John Smith',
          description: 'A premium book with exclusive content',
          coverImage: PREMIUM_BOOK_PLACEHOLDER,
          pdfUrl: '/uploads/pdfs/sample.pdf',
          category: 'Non-fiction',
          publishedYear: 2023,
          pages: 300,
          isPremium: true,
          createdAt: new Date().toISOString()
        }
      ];
      fs.writeFileSync(BOOKS_FILE, JSON.stringify(sampleBooks, null, 2));
      return sampleBooks;
    }
    const data = fs.readFileSync(BOOKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading books file:', err);
    return [];
  }
};

const saveBooks = (books) => {
  fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2));
};

// Book routes
app.get('/api/books', (req, res) => {
  try {
    const isPremium = req.query.isPremium === 'true';
    const books = getBooks();
    
    if (req.query.isPremium !== undefined) {
      const filteredBooks = books.filter(book => book.isPremium === isPremium);
      return res.json(filteredBooks);
    }
    
    res.json(books);
  } catch (error) {
    console.error('Error getting books:', error);
    res.status(500).json({ message: 'Error getting books', error: error.message });
  }
});

app.get('/api/books/:id', (req, res) => {
  try {
    const books = getBooks();
    const book = books.find(book => book._id === req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Error getting book', error: error.message });
  }
});

app.post('/api/books', (req, res) => {
  try {
    const books = getBooks();
    const newBook = {
      _id: `book_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    books.push(newBook);
    saveBooks(books);
    
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ message: 'Error creating book', error: error.message });
  }
});

app.put('/api/books/:id', (req, res) => {
  try {
    const books = getBooks();
    const index = books.findIndex(book => book._id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    const updatedBook = {
      ...books[index],
      ...req.body,
      _id: req.params.id // Ensure ID doesn't change
    };
    
    books[index] = updatedBook;
    saveBooks(books);
    
    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error: error.message });
  }
});

app.delete('/api/books/:id', (req, res) => {
  try {
    const books = getBooks();
    const filteredBooks = books.filter(book => book._id !== req.params.id);
    
    if (filteredBooks.length === books.length) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    saveBooks(filteredBooks);
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting book', error: error.message });
  }
});

app.get('/api/premium-books', (req, res) => {
  try {
    const books = getBooks();
    const premiumBooks = books.filter(book => book.isPremium);
    res.json(premiumBooks);
  } catch (error) {
    res.status(500).json({ message: 'Error getting premium books', error: error.message });
  }
});

app.get('/api/free-books', (req, res) => {
  try {
    const books = getBooks();
    const freeBooks = books.filter(book => !book.isPremium);
    res.json(freeBooks);
  } catch (error) {
    res.status(500).json({ message: 'Error getting free books', error: error.message });
  }
});

// Ensure necessary directories and files exist
ensureUploadsAndSamplePdf();

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from client/build
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Local storage mode active (using JSON files in ${DATA_DIR})`);
  console.log('🔑 Default admin credentials:');
  console.log('   - Email: admin@booksansar.com');
  console.log('   - Password: admin123');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const newPort = PORT + 1;
    console.error(`⚠️ Port ${PORT} is already in use, trying port ${newPort}...`);
    
    // Try a different port
    server.close();
    app.listen(newPort, () => {
      console.log(`🚀 Server running on port ${newPort} (fallback)`);
      console.log(`📁 Local storage mode active (using JSON files in ${DATA_DIR})`);
      console.log('🔑 Default admin credentials:');
      console.log('   - Email: admin@booksansar.com');
      console.log('   - Password: admin123');
    });
  } else {
    console.error(`❌ Server error:`, err);
  }
}); 