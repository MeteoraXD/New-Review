const mongoose = require('mongoose');
const Book = require('./models/Book');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booksansar')
    .then(async () => {
        console.log('Connected to MongoDB');
        
        try {
            // Find all books
            const books = await Book.find({});
            console.log(`Found ${books.length} books`);
            
            // Sample PDF URL - this is a valid publicly accessible PDF
            const samplePdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
            
            // Update books without PDF URLs
            let updatedCount = 0;
            for (const book of books) {
                if (!book.pdfUrl) {
                    book.pdfUrl = samplePdfUrl;
                    await book.save();
                    updatedCount++;
                    console.log(`Updated book: ${book.title}`);
                }
            }
            
            console.log(`Done updating ${updatedCount} books with sample PDF URLs`);
        } catch (error) {
            console.error('Error updating books:', error);
        } finally {
            // Close the connection
            mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    }); 