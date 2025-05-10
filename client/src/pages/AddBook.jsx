import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
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
  CircularProgress
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { PLACEHOLDER_IMAGE, ERROR_IMAGE, isValidImageUrl } from '../utils/imageUtils';
import BookCover from '../components/BookCover';

const AddBook = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    coverImage: PLACEHOLDER_IMAGE,
    category: '',
    publishedYear: '',
    pages: '',
    isPremium: false,
    pdfUrl: ''
  });

  // Define categories based on the Book model
  const categories = [
    'Fiction',
    'Non-Fiction',
    'Science',
    'Technology',
    'History',
    'Biography',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle numeric fields
    if (['publishedYear', 'pages'].includes(name)) {
      if (value && isNaN(value)) {
        setError(`${name.charAt(0).toUpperCase() + name.slice(1)} must be a number`);
        return;
      }
    }

    // Validate image URL in real-time
    if (name === 'coverImage') {
      const isValid = isValidImageUrl(value);
      setError(isValid ? '' : 'Please enter a valid image URL');
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      setSelectedPdfFile(null);
      return;
    }
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      setSelectedPdfFile(null);
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      setSelectedPdfFile(null);
      return;
    }
    
    setError('');
    setSelectedPdfFile(file);
    console.log('Selected PDF file:', file.name, file.type, file.size);
  };

  const uploadPdfFile = async () => {
    if (!selectedPdfFile) {
      setError('Please select a PDF file');
      return false;
    }
    
    setUploadingPdf(true);
    
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('pdf', selectedPdfFile);
      
      console.log('Uploading PDF file:', selectedPdfFile.name);
      
      // Try to upload the PDF file
      const response = await axios.post('/api/books/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Upload response:', response.data);
      
      if (response.data && response.data.pdfUrl) {
        console.log('PDF URL from server:', response.data.pdfUrl);
        return response.data.pdfUrl;
      } else {
        throw new Error('No PDF URL in response');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    } finally {
      setUploadingPdf(false);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.author.trim()) return 'Author is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.category) return 'Category is required';
    if (!formData.publishedYear || isNaN(formData.publishedYear) || 
        Number(formData.publishedYear) < 1000 || 
        Number(formData.publishedYear) > new Date().getFullYear())
      return 'Please enter a valid published year';
    if (!formData.pages || isNaN(formData.pages) || Number(formData.pages) < 1)
      return 'Pages must be a valid number greater than 0';
    if (!selectedPdfFile && !formData.pdfUrl)
      return 'Please upload a PDF file for this book';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let pdfUrl = formData.pdfUrl;
      
      // If a PDF file is selected, upload it first
      if (selectedPdfFile) {
        try {
          pdfUrl = await uploadPdfFile();
          setSuccess('PDF uploaded successfully!');
        } catch (uploadError) {
          setError('Failed to upload PDF: ' + (uploadError.message || 'Unknown error'));
          setLoading(false);
          return;
        }
      }

      const bookData = {
        ...formData,
        pdfUrl: pdfUrl,
        publishedYear: Number(formData.publishedYear),
        pages: Number(formData.pages)
      };

      console.log('Sending book data:', bookData);
      
      const response = await axios.post('/api/books', bookData);
      console.log('Server response:', response);

      if (response.status === 201) {
        setSuccess('Book added successfully!');
        setTimeout(() => {
          navigate('/books');
        }, 1000);
      }
    } catch (err) {
      console.error('Error adding book:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in to add a book.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid book data. Please check your inputs.');
      } else if (err.response?.status === 404) {
        setError('API endpoint not found. Please check server configuration.');
      } else {
        setError(
          err.response?.data?.message || 
          err.response?.data?.error || 
          'Error adding book. Please try again later.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Add New Book
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

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Form Fields */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
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
                      value={formData.category}
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
                    value={formData.publishedYear}
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
                    value={formData.pages}
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
                        borderColor: formData.isPremium ? 'secondary.main' : 'success.main',
                        borderRadius: 1,
                        p: 2,
                        bgcolor: formData.isPremium ? 'rgba(156, 39, 176, 0.1)' : 'rgba(46, 125, 50, 0.1)',
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
                          color: formData.isPremium ? 'secondary.main' : 'success.main'
                        }}
                      >
                        {formData.isPremium ? '⭐ Premium Content' : '✓ Premium Content'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {formData.isPremium 
                          ? 'Premium books are only accessible to premium members.' 
                          : 'All books are premium content and require premium membership to access.'}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.isPremium}
                            onChange={handleChange}
                            name="isPremium"
                            color="secondary"
                          />
                        }
                        label={`Set as ${formData.isPremium ? 'premium' : 'premium'}`}
                      />
                    </Box>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cover Image URL"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleChange}
                    helperText="Enter a valid image URL"
                  />
                </Grid>
                
                {/* PDF Upload Section */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
                    Upload PDF:
                  </Typography>
                  
                  <input
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    id="pdf-file-input"
                    type="file"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <label htmlFor="pdf-file-input">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        disabled={loading || uploadingPdf}
                        color="primary"
                        fullWidth
                      >
                        Select PDF File
                      </Button>
                    </label>
                    
                    {selectedPdfFile && (
                      <Box 
                        sx={{ 
                          p: 2, 
                          bgcolor: 'success.light', 
                          color: 'white', 
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Selected file: {selectedPdfFile.name}
                        </Typography>
                      </Box>
                    )}
                    
                    {!selectedPdfFile && !formData.pdfUrl && (
                      <Alert severity="info">
                        Please select a PDF file for this book.
                      </Alert>
                    )}
                    
                    {formData.pdfUrl && (
                      <Alert severity="success">
                        PDF already uploaded at: {formData.pdfUrl}
                      </Alert>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/books')}
                      disabled={loading || uploadingPdf}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || uploadingPdf}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {loading ? 'Adding...' : 'Add Book'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Cover Image Preview */}
            <Grid item xs={12} md={4}>
              <Card>
                <BookCover
                  imageUrl={formData.coverImage}
                  title={formData.title || 'Book Title'}
                  author={formData.author || 'Author Name'}
                  height={300}
                />
                <CardContent>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    align="center"
                  >
                    {formData.title || 'Book Title'}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    color="text.secondary" 
                    gutterBottom 
                    align="center"
                  >
                    {formData.author || 'Author Name'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    align="center"
                  >
                    {formData.category || 'Category'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddBook;
