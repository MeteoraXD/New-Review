import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, CircularProgress, Typography, Paper, Button, Box } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import axios from '../utils/axios';
import BookStylePDFViewer from '../components/BookStylePDFViewer';
import { formatPdfUrl } from '../utils/pdfUtils';
import { useAuth } from '../context/AuthContext';

const ReadBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPremiumAccess } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [premiumStatus, setPremiumStatus] = useState(null);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (user) {
        try {
          const response = await axios.get('/api/premium/status');
          setPremiumStatus(response.data.data.isPremium);
        } catch (err) {
          console.error('Error checking premium status:', err);
        }
      }
    };

    checkPremiumStatus();
  }, [user]);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await axios.get(`/api/books/${id}`);
        if (response.data) {
          setBook(response.data);
        }
      } catch (err) {
        if (err.response?.status === 403) {
          const errorData = err.response.data;
          if (errorData.isPremiumRestricted) {
            if (errorData.requiresAuthentication) {
              setError('Please log in to access this premium content');
            } else if (errorData.requiresUpgrade) {
              setError('This book requires premium access. Please upgrade your account to read.');
            }
          } else {
            setError(err.response?.data?.message || 'You do not have permission to view this book');
          }
        } else {
          setError(err.response?.data?.message || 'Error loading book');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleUpgrade = () => {
    navigate('/premium');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !book) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <LockIcon color="secondary" sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h5" color="secondary" gutterBottom>
            Access Restricted
          </Typography>
          <Typography color="error" sx={{ mb: 3 }}>{error || 'Book not found'}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button variant="outlined" onClick={handleClose}>
              Back to Book
            </Button>
            {error?.includes('log in') && (
              <Button variant="contained" color="primary" onClick={handleLogin}>
                Log In
              </Button>
            )}
            {error?.includes('upgrade') && (
              <Button variant="contained" color="secondary" onClick={handleUpgrade}>
                Upgrade to Premium
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    );
  }

  // Check premium access
  if (book.isPremium && !premiumStatus) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <LockIcon color="secondary" sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h5" color="secondary" gutterBottom>
            Premium Book
          </Typography>
          <Typography sx={{ mb: 3 }}>
            This is a premium book. Upgrade your account to read the full content.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button variant="outlined" onClick={handleClose}>
              Back to Book
            </Button>
            <Button variant="contained" color="secondary" onClick={handleUpgrade}>
              Upgrade to Premium
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  const formattedPdfUrl = formatPdfUrl(book.pdfUrl);

  return (
    <BookStylePDFViewer
      pdfUrl={formattedPdfUrl}
      bookTitle={book.title}
      onClose={handleClose}
    />
  );
};

export default ReadBook; 