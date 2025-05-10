// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
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
console.log(`MongoDB URI found: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore';

// Flag to track if we're using MongoDB or local JSON
let usingLocalStorage = false;

// Read connection string from .env file if it exists
if (fs.existsSync(path.join(__dirname, '.env'))) {
  require('dotenv').config();
}

// Better MongoDB connection with more detailed logging
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 60000, // Increase to 60 seconds (from 30)
  socketTimeoutMS: 75000, // Increase to 75 seconds (from 45)
  connectTimeoutMS: 60000, // Add connection timeout
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  usingLocalStorage = false;
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('MongoDB connection details:');
  console.error('- URI:', process.env.MONGODB_URI || MONGO_URI);
  console.error('- Error code:', err.code);
  console.error('- Error name:', err.name);
  // Continue running the server even if MongoDB fails
  console.log('⚠️ Server continuing with local JSON storage - some features will be unavailable');
  usingLocalStorage = true;
  
  // Set up local storage directories
  const DATA_DIR = path.join(__dirname, 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory at', DATA_DIR);
  }
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected - attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

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

// Create uploads directory and ensure it exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PDF_DIR = path.join(UPLOADS_DIR, 'pdfs');
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
  console.log('Created uploads directory structure at', PDF_DIR);
}

// Serve uploaded files with enhanced headers for PDFs
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
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Don't cache PDFs for now
    }
  },
  fallthrough: true // Allow the next middleware to handle the request if the file is not found
}));

// Special direct route to handle PDF files with better error handling
app.get('/uploads/pdfs/:filename', (req, res, next) => {
  const requestedFilePath = path.join(__dirname, 'uploads/pdfs', req.params.filename);
  console.log(`PDF file requested: ${requestedFilePath}`);
  
  // If the file exists, serve it directly
  if (fs.existsSync(requestedFilePath)) {
    console.log(`Found PDF file: ${requestedFilePath}, serving directly`);
    
    // Set PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + req.params.filename + '"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Stream the file directly
    return fs.createReadStream(requestedFilePath).pipe(res);
  }
  
  console.log(`PDF file not found: ${requestedFilePath}, checking for alternatives`);
  
  // Try to find any PDF file in the directory as a fallback
  const directoryFiles = fs.readdirSync(path.join(__dirname, 'uploads/pdfs'));
  const pdfFiles = directoryFiles.filter(file => file.endsWith('.pdf'));
  
  if (pdfFiles.length > 0) {
    const fallbackFile = pdfFiles[0];
    const fallbackPath = path.join(__dirname, 'uploads/pdfs', fallbackFile);
    console.log(`Using fallback PDF: ${fallbackPath}`);
    
    // Set PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + fallbackFile + '"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send the fallback PDF
    return fs.createReadStream(fallbackPath).pipe(res);
  }
  
  // If still no PDF found, create a simple one on the fly
  console.log(`No PDF files found in uploads directory, creating simple PDF`);
  
  // Create a very basic PDF file content
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
  
  // Save the sample PDF to the folder for future use
  const samplePath = path.join(__dirname, 'uploads/pdfs', 'sample.pdf');
  fs.writeFileSync(samplePath, samplePdfContent);
  console.log(`Created and saved sample PDF at ${samplePath}`);
  
  // Set PDF headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="sample.pdf"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send the sample PDF from memory
  return res.send(Buffer.from(samplePdfContent));
});

// Super simple upload endpoint with minimal code
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

// PDF check endpoint - verify if a file exists
app.get('/check-pdf', (req, res) => {
  const filename = req.query.filename;
  
  if (!filename) {
    return res.status(400).json({ success: false, message: 'Missing filename parameter' });
  }
  
  // Clean up the filename - just get the basename without path
  const baseFilename = path.basename(filename);
  
  // Check both direct path and uploads/pdfs path
  const directPath = path.join(__dirname, baseFilename);
  const uploadsPath = path.join(__dirname, 'uploads/pdfs', baseFilename);
  
  const results = { success: true, filename: baseFilename, exists: false, paths: {} };
  
  // Check if file exists in direct path
  if (fs.existsSync(directPath)) {
    results.exists = true;
    results.paths.direct = {
      path: directPath,
      exists: true,
      size: fs.statSync(directPath).size,
      url: `${req.protocol}://${req.get('host')}/${baseFilename}`
    };
  } else {
    results.paths.direct = {
      path: directPath,
      exists: false
    };
  }
  
  // Check if file exists in uploads/pdfs directory
  if (fs.existsSync(uploadsPath)) {
    results.exists = true;
    results.paths.uploads = {
      path: uploadsPath,
      exists: true,
      size: fs.statSync(uploadsPath).size,
      url: `${req.protocol}://${req.get('host')}/uploads/pdfs/${baseFilename}`
    };
  } else {
    results.paths.uploads = {
      path: uploadsPath,
      exists: false
    };
  }
  
  // List all files in the uploads directory for debugging
  const uploadDir = path.join(__dirname, 'uploads/pdfs');
  try {
    if (fs.existsSync(uploadDir)) {
      const allFiles = fs.readdirSync(uploadDir);
      results.allUploadedFiles = allFiles.map(file => ({
        filename: file,
        url: `${req.protocol}://${req.get('host')}/uploads/pdfs/${file}`
      }));
    }
  } catch (err) {
    results.error = err.message;
  }
  
  res.json(results);
});

// PDF upload endpoints
app.post('/api/books/upload-pdf', upload.single('pdf'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }
    
    console.log('PDF file uploaded:', req.file);
    
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

// Alternative direct upload endpoint
app.post('/direct-upload-pdf', upload.single('pdf'), (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }
    
    console.log('PDF file uploaded directly:', req.file);
    
    // Generate clean URL for the uploaded file
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
});

// Import routes
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const localAuthController = require('./controllers/localAuthController');
const reviewRoutes = require('./routes/reviewRoutes');

// Add direct payment route before other routes (no auth required)
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { token, amount } = req.body;
    console.log('Direct payment verification request received:', { token: token.substring(0, 10) + '...', amount });
    
    if (!token || !amount) {
      return res.status(400).json({ success: false, message: 'Token and amount are required' });
    }
    
    // Handle test payments (tokens that start with test_token_)
    if (token.startsWith('test_token_')) {
      console.log('Processing test payment token:', token);
      // Return success for test payments
      return res.status(200).json({
        success: true,
        data: {
          token: token,
          amount: amount,
          status: "Completed",
          idx: "test_transaction_" + Date.now(),
          mobile: "9800000000",
          product_identity: "premium-test",
          product_name: "Premium Subscription Test",
          created_on: new Date().toISOString()
        }
      });
    }
    
    // Call Khalti verification API
    const axios = require('axios');
    
    console.log('Verifying Khalti payment:', { token: token.substring(0, 10) + '...', amount });
    
    // HARDCODED TEST VALUES - This ensures the request works for test mode
    // In production, you would replace this with environment variables
    const testSecretKey = "test_secret_key_f59e8b7d18b4499ca40f68195a846e9b";
    
    // For test mode, use the correct Khalti API URL
    const khaltiUrl = 'https://a.khalti.com/api/v2/payment/verify/';
    
    console.log('Using Khalti verification URL:', khaltiUrl);
    console.log('Using hardcoded test keys for Khalti test mode');
    
    const khaltiResponse = await axios.post(
      khaltiUrl, 
      {
        token: token,
        amount: amount
      },
      {
        headers: {
          'Authorization': `Key ${testSecretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Khalti verification response:', khaltiResponse.data);
    
    return res.status(200).json({
      success: true,
      data: khaltiResponse.data
    });
  } catch (error) {
    console.error('Error verifying Khalti payment:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    return res.status(500).json({ 
      success: false,
      message: 'Error verifying payment', 
      error: error.message 
    });
  }
});

// Special admin login route with local fallback
app.post('/api/auth/admin-login', localAuthController.login);

// Register API routes
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

// Catch-all route for debugging
app.use('*', (req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Endpoint not found', 
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      '/upload',
      '/direct-upload-pdf',
      '/api/books/upload-pdf'
    ]
  });
});

// Add global error handlers
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(error.name, error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(error.name, error.message);
  console.error(error.stack);
  process.exit(1);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload endpoints available at:`);
  console.log(`- http://localhost:${PORT}/api/books/upload-pdf`);
  console.log(`- http://localhost:${PORT}/direct-upload-pdf`);
  
  // Create uploads directory structure if it doesn't exist
  const uploadDir = path.join(__dirname, 'uploads/pdfs');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at', uploadDir);
  }
  
  // Create a sample PDF if none exists
  const samplePath = path.join(__dirname, 'uploads/pdfs', 'sample.pdf');
  if (!fs.existsSync(samplePath)) {
    try {
      // Create a very basic PDF file content
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
});

module.exports = app; 