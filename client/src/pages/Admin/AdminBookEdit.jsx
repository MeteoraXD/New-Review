import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { toast } from 'react-toastify';
import axios from '../../utils/axios';
import PDFUploader from '../../components/PDFUploader';
import { PLACEHOLDER_IMAGE, isValidImageUrl } from '../../utils/imageUtils';
import BookCover from '../../components/BookCover';
import BasicPDFViewer from '../../components/BasicPDFViewer';

const categories = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'History',
  'Biography',
  'Self-Help',
  'Mystery',
  'Romance',
  'Fantasy',
  'Science Fiction',
  'Thriller',
  'Horror',
  'Children',
  'Young Adult',
  'Poetry',
  'Other'
];

const AdminBookEdit = ({ isNew }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewBook = isNew || id === 'new';
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewPdf, setPreviewPdf] = useState(false);
  
  const [book, setBook] = useState({
    title: '',
    author: '',
    description: '',
    coverImage: PLACEHOLDER_IMAGE,
    category: '',
    publishedYear: new Date().getFullYear(),
    pages: '',
    isPremium: false,
    pdfUrl: ''
  });

  useEffect(() => {
    if (!isNewBook) {
      fetchBook();
    }
  }, [id]);

  const fetchBook = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/books/${id}`);
      setBook(response.data);
    } catch (err) {
      console.error('Error fetching book:', err);
      setError('Failed to load book. ' + (err.response?.data?.message || err.message));
      toast.error('Error loading book details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    const newValue = type === 'checkbox' ? checked : value;
    
    setBook(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handlePdfUploadSuccess = (pdfUrl) => {
    setBook(prev => ({
      ...prev,
      pdfUrl
    }));
    setSuccess('PDF uploaded successfully and linked to the book!');
    toast.success('PDF uploaded successfully');
  };

  const validateForm = () => {
    if (!book.title.trim()) return 'Title is required';
    if (!book.author.trim()) return 'Author is required';
    if (!book.description.trim()) return 'Description is required';
    if (!book.category) return 'Category is required';
    if (!book.publishedYear || isNaN(book.publishedYear) || 
        Number(book.publishedYear) < 1000 || 
        Number(book.publishedYear) > new Date().getFullYear())
      return 'Please enter a valid published year';
    if (!book.pages || isNaN(book.pages) || Number(book.pages) < 1)
      return 'Pages must be a valid number greater than 0';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const bookData = {
        ...book,
        publishedYear: Number(book.publishedYear),
        pages: Number(book.pages)
      };

      console.log('Sending book data:', bookData);
      
      let response;
      if (isNewBook) {
        response = await axios.post('/api/books', bookData);
        toast.success('Book created successfully!');
      } else {
        response = await axios.put(`/api/books/${id}`, bookData);
        toast.success('Book updated successfully!');
      }

      setSuccess(isNewBook ? 'Book created successfully!' : 'Book updated successfully!');
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/admin/books');
      }, 1500);
    } catch (err) {
      console.error('Error saving book:', err);
      
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           'Error saving book. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePreviewPdf = () => {
    setPreviewPdf(true);
  };

  const handleClosePdfPreview = () => {
    setPreviewPdf(false);
  };
  
  const handleDeleteBook = async () => {
    // Confirm before deleting
    if (!window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      const response = await axios.delete(`/api/books/${id}`);
      
      if (response.status === 200) {
        toast.success('Book deleted successfully!');
        // Navigate back to book list after deletion
        setTimeout(() => {
          navigate('/admin/books');
        }, 1500);
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           'Error deleting book. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading book details...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {isNewBook ? 'Add New Book' : 'Edit Book'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Basic Info" />
          <Tab label="PDF Management" />
        </Tabs>

        <form onSubmit={handleSubmit}>
          {/* Basic Info Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      name="title"
                      value={book.title}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Author"
                      name="author"
                      value={book.author}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={book.description}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={book.category}
                        onChange={handleChange}
                        label="Category"
                      >
                        {categories.map(category => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Published Year"
                      name="publishedYear"
                      type="number"
                      value={book.publishedYear}
                      onChange={handleChange}
                      required
                      inputProps={{ 
                        min: 1000, 
                        max: new Date().getFullYear(),
                        step: 1
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Pages"
                      name="pages"
                      type="number"
                      value={book.pages}
                      onChange={handleChange}
                      required
                      inputProps={{ min: 1, step: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <Box 
                        sx={{ 
                          border: '1px solid',
                          borderColor: book.isPremium ? 'secondary.main' : 'success.main',
                          borderRadius: 1,
                          p: 2,
                          bgcolor: book.isPremium ? 'rgba(156, 39, 176, 0.1)' : 'rgba(46, 125, 50, 0.1)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: book.isPremium ? 'secondary.main' : 'success.main'
                          }}
                        >
                          {book.isPremium ? '⭐ Premium Content' : '✓ Free Content'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                          {book.isPremium 
                            ? 'Premium books are only accessible to premium members.' 
                            : 'Free books are accessible to all users.'}
                        </Typography>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={book.isPremium}
                              onChange={handleChange}
                              name="isPremium"
                              color="secondary"
                            />
                          }
                          label={`Set as ${book.isPremium ? 'premium' : 'free'}`}
                        />
                      </Box>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cover Image URL"
                      name="coverImage"
                      value={book.coverImage}
                      onChange={handleChange}
                      helperText="Enter a valid image URL"
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Cover Image Preview */}
              <Grid item xs={12} md={4}>
                <Card>
                  <BookCover
                    imageUrl={book.coverImage}
                    title={book.title || 'Book Title'}
                    author={book.author || 'Author Name'}
                    height={350}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom align="center">
                      {book.title || 'Book Title'}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom align="center">
                      {book.author || 'Author Name'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      {book.category || 'Category'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* PDF Management Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  PDF Management
                </Typography>
                <Typography variant="body2" paragraph>
                  Upload a PDF file for this book. The PDF will be available for reading and downloading.
                </Typography>
                <Divider sx={{ my: 2 }} />
              </Grid>
              <Grid item xs={12} md={8}>
                <PDFUploader 
                  onUploadSuccess={handlePdfUploadSuccess}
                  buttonLabel="Upload Book PDF"
                  isWithinForm={true}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      PDF Status
                    </Typography>
                    {book.pdfUrl ? (
                      <>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          PDF is available for this book
                        </Alert>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          onClick={handlePreviewPdf}
                          sx={{ mb: 1 }}
                        >
                          Preview PDF
                        </Button>
                      </>
                    ) : (
                      <Alert severity="info">
                        No PDF has been uploaded for this book yet.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Submit Buttons */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              {!isNewBook && (
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={handleDeleteBook}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                  Delete Book
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/admin/books')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : null}
              >
                {saving ? 'Saving...' : (isNewBook ? 'Create Book' : 'Update Book')}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      {/* PDF Preview Modal */}
      {previewPdf && book.pdfUrl && (
        <BasicPDFViewer
          pdfUrl={book.pdfUrl}
          bookTitle={book.title}
          onClose={handleClosePdfPreview}
        />
      )}
    </Container>
  );
};

export default AdminBookEdit; 