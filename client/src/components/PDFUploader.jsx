import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from '../utils/axios';
import { toast } from 'react-toastify';

/**
 * Component for uploading PDF files
 * @param {string} bookId - Optional ID of book to associate PDF with
 * @param {function} onUploadSuccess - Callback when upload is successful
 * @param {string} buttonLabel - Custom label for the select button
 * @param {string} variant - MUI button variant
 * @param {boolean} isWithinForm - Whether this uploader is within a form
 */
const PDFUploader = ({ 
  bookId, 
  onUploadSuccess, 
  buttonLabel = "Select PDF File",
  variant = 'contained',
  isWithinForm = false
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    // Reset states
    setError('');
    setSuccess(false);
    
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      setSelectedFile(null);
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    console.log('Selected file:', file.name, file.type, file.size);
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }
    
    setUploading(true);
    setError('');
    
    // Create FormData object
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    
    // Add bookId if provided
    if (bookId) {
      formData.append('bookId', bookId);
    }
    
    try {
      console.log('Uploading PDF file:', selectedFile.name);
      console.log('FormData contents:', Array.from(formData.entries()));
      
      // First try the book-specific endpoint
      let response;
      try {
        response = await axios.post('/api/books/upload-pdf', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (err) {
        console.warn('Book-specific endpoint failed, trying generic upload endpoint');
        // If that fails, try the generic upload endpoint
        response = await axios.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      console.log('Upload response:', response.data);
      
      if (response.data && response.data.pdfUrl) {
        setSuccess(true);
        toast.success('PDF uploaded successfully');
        
        // Tell parent component about the new PDF URL
        if (onUploadSuccess) {
          console.log('PDF URL from server:', response.data.pdfUrl);
          onUploadSuccess(response.data.pdfUrl);
        }
        
        // Reset the file input
        setSelectedFile(null);
        
        // Reset the file input element to allow the same file to be selected again
        const fileInput = document.getElementById('pdf-file-input');
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        throw new Error('No PDF URL in response');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setError(error.response?.data?.message || 'Failed to upload PDF');
      toast.error('PDF upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission differently
  const handleButtonClick = (e) => {
    if (isWithinForm) {
      e.preventDefault(); // Prevent form submission when inside a form
    }
    uploadFile();
  };

  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <input
        accept="application/pdf"
        style={{ display: 'none' }}
        id="pdf-file-input"
        type="file"
        onChange={handleFileChange}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <label htmlFor="pdf-file-input">
          <Button
            variant={variant}
            component="span"
            startIcon={<CloudUploadIcon />}
            disabled={uploading}
            color="primary"
            fullWidth
          >
            {buttonLabel || "Select PDF File"}
          </Button>
        </label>
        
        {selectedFile && (
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
              Selected file: {selectedFile.name}
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={handleButtonClick}
              disabled={uploading}
              fullWidth
            >
              {uploading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Upload PDF'
              )}
            </Button>
          </Paper>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 1 }}>
            PDF uploaded successfully!
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default PDFUploader; 