/**
 * Script to ensure upload directories exist and have the correct permissions
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper function to log with color
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

// Main function to create and verify directories
const setupUploadDirectories = () => {
  log('Setting up upload directories...', colors.cyan);

  // Check the base upload directory
  const baseUploadDir = path.join(__dirname, 'uploads');
  ensureDirectoryExists(baseUploadDir, 'Main uploads directory');

  // Check PDF uploads directory
  const pdfUploadDir = path.join(baseUploadDir, 'pdfs');
  ensureDirectoryExists(pdfUploadDir, 'PDF uploads directory');

  // Check images upload directory
  const imageUploadDir = path.join(baseUploadDir, 'images');
  ensureDirectoryExists(imageUploadDir, 'Image uploads directory');

  // Create a test file to verify write permissions
  const testFilePath = path.join(pdfUploadDir, '_test_file.txt');
  try {
    fs.writeFileSync(testFilePath, 'This is a test file to verify write permissions.');
    log(`✅ Successfully wrote test file to ${testFilePath}`, colors.green);

    // Check if we can read the file
    const fileContent = fs.readFileSync(testFilePath, 'utf8');
    log('✅ Successfully read test file', colors.green);

    // Delete the test file
    fs.unlinkSync(testFilePath);
    log('✅ Successfully deleted test file', colors.green);
  } catch (error) {
    log(`❌ Error testing file permissions: ${error.message}`, colors.red);
    if (error.code === 'EACCES') {
      log('⚠️ Permission denied. Make sure the Node.js process has write permissions to the uploads directory.', colors.yellow);
      log('Try running: chmod -R 755 ./uploads', colors.yellow);
    }
  }

  // Create a sample PDF for testing if it doesn't exist
  const samplePdfPath = path.join(pdfUploadDir, 'sample.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    try {
      // Create a very basic PDF file
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
BT /F1 14 Tf 150 650 Td (This is a sample PDF file for testing.) Tj ET
BT /F1 14 Tf 120 620 Td (You can replace this with your own content.) Tj ET
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
      
      fs.writeFileSync(samplePdfPath, samplePdfContent);
      log(`✅ Created sample PDF at ${samplePdfPath}`, colors.green);
    } catch (err) {
      log(`❌ Failed to create sample PDF: ${err.message}`, colors.red);
    }
  } else {
    log(`ℹ️ Sample PDF already exists at ${samplePdfPath}`, colors.cyan);
  }

  log('\n📁 Upload directories set up successfully!', colors.bright + colors.green);
  log(`ℹ️ PDF Upload path: ${pdfUploadDir}`, colors.cyan);
  log(`ℹ️ Images Upload path: ${imageUploadDir}`, colors.cyan);
};

// Helper function to ensure a directory exists
function ensureDirectoryExists(dirPath, dirName) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`✅ Created ${dirName} at ${dirPath}`, colors.green);
    } else {
      log(`ℹ️ ${dirName} already exists at ${dirPath}`, colors.cyan);
    }

    // Check directory permissions
    try {
      // Try to access the directory with read/write permissions
      fs.accessSync(dirPath, fs.constants.R_OK | fs.constants.W_OK);
      log(`✅ Have read/write permissions to ${dirName}`, colors.green);
    } catch (err) {
      log(`❌ Cannot access ${dirName} with read/write permissions`, colors.red);
      log(`⚠️ Error: ${err.message}`, colors.yellow);
    }
  } catch (err) {
    log(`❌ Failed to create or check ${dirName}: ${err.message}`, colors.red);
  }
}

// Run the setup function
setupUploadDirectories(); 