const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Set up upload middleware for PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads/pdfs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors({
  origin: '*', // Allow all origins during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests with wildcard
app.options('*', cors({ origin: '*' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads/pdfs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory at', uploadDir);
}

// Root route for testing server status
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>PDF Upload Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          form { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; }
          button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
          .result { margin-top: 20px; padding: 15px; background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>PDF Upload Test</h1>
        
        <h2>Simplified Upload Form (Recommended)</h2>
        <form action="/upload" method="post" enctype="multipart/form-data">
          <div>
            <label for="simple-pdf">Select PDF:</label>
            <input type="file" id="simple-pdf" name="pdf" accept="application/pdf" required>
          </div>
          <button type="submit">Upload PDF (Simple)</button>
        </form>
        
        <h2>Direct Upload Form</h2>
        <form action="/direct-upload-pdf" method="post" enctype="multipart/form-data">
          <div>
            <label for="direct-pdf">Select PDF:</label>
            <input type="file" id="direct-pdf" name="pdf" accept="application/pdf" required>
          </div>
          <button type="submit">Upload PDF (Direct)</button>
        </form>

        <h2>API Upload Form</h2>
        <form action="/api/books/upload-pdf" method="post" enctype="multipart/form-data">
          <div>
            <label for="api-pdf">Select PDF:</label>
            <input type="file" id="api-pdf" name="pdf" accept="application/pdf" required>
          </div>
          <button type="submit">Upload PDF (API)</button>
        </form>

        <div>
          <h3>Test URLs:</h3>
          <ul>
            <li><a href="/test-uploads" target="_blank">Test Uploads Directory</a></li>
            <li><a href="/uploads" target="_blank">Browse Uploads</a></li>
            <li><a href="/test" target="_blank">API Test Endpoint</a></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Test route for uploads directory
app.get('/test-uploads', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads/pdfs');
  
  if (fs.existsSync(uploadDir)) {
    try {
      const files = fs.readdirSync(uploadDir);
      res.json({
        message: 'Uploads directory exists',
        path: uploadDir,
        files: files
      });
    } catch (err) {
      res.status(500).json({
        message: 'Error reading uploads directory',
        error: err.message
      });
    }
  } else {
    res.status(404).json({
      message: 'Uploads directory does not exist',
      path: uploadDir
    });
  }
});

// Add a test endpoint to confirm the server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// PDF upload endpoints
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
    
    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/pdfs/${req.file.filename}`;
    
    console.log('Generated PDF URL:', fileUrl);
    
    return res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      filename: req.file.filename,
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

app.post('/direct-upload-pdf', upload.single('pdf'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }
    
    console.log('PDF file uploaded directly:', req.file);
    
    // Generate URL for the uploaded file
    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/pdfs/${req.file.filename}`;
    
    console.log('Generated PDF URL:', fileUrl);
    
    res.status(200).json({ 
      message: 'PDF uploaded successfully',
      filename: req.file.filename,
      pdfUrl: fileUrl
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ 
      message: 'Error uploading PDF', 
      error: error.message 
    });
  }
});

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ message: `Route ${req.url} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: err.message,
    path: req.url
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore')
  .then(() => console.log('Successfully connected to MongoDB Atlas.'))
  .catch(err => console.error('MongoDB connection error:', err.message));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 