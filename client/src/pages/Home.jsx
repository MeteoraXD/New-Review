import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, Grid, Paper, Card, CardMedia, CardContent, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Placeholder image for books
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EBook Cover%3C/text%3E%3C/svg%3E";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [freeBooks, setFreeBooks] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loadingFree, setLoadingFree] = useState(false);
  const [loadingFeatured, setLoadingFeatured] = useState(false);

  useEffect(() => {
    const fetchFreeBooks = async () => {
      setLoadingFree(true);
      try {
        const response = await axios.get('/api/books?limit=3&isPremium=false');
        setFreeBooks(response.data.data || []);
      } catch (error) {
        console.error('Error fetching free books:', error);
      } finally {
        setLoadingFree(false);
      }
    };

    const fetchFeaturedBooks = async () => {
      setLoadingFeatured(true);
      try {
        // Fetch books with limit=3 to get just a few for the featured section
        const response = await axios.get('/api/books?limit=3');
        setFeaturedBooks(response.data.data || response.data || []);
        console.log('Featured books:', response.data);
      } catch (error) {
        console.error('Error fetching featured books:', error);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFreeBooks();
    fetchFeaturedBooks();
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Your Online Book Library
              </Typography>
              <Typography variant="h5" paragraph>
                Discover, read, and manage your favorite books in one place.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  onClick={() => navigate('/books')}
                  sx={{ mr: 2 }}
                >
                  Browse Books
                </Button>
                {!isAuthenticated && (
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    size="large"
                    onClick={() => navigate('/register')}
                  >
                    Sign Up
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect width='500' height='300' fill='%234050b5'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='white' text-anchor='middle' dominant-baseline='middle'%3EBook Library Illustration%3C/text%3E%3C/svg%3E"
                alt="Book Library"
                sx={{ 
                  width: '100%', 
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: 3
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Featured Books Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Featured Books
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Check out our selection of top books
        </Typography>
        
        {loadingFeatured ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
            {featuredBooks.length > 0 ? (
              featuredBooks.map((book) => (
                <Grid item key={book._id} xs={12} sm={6} md={4}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => navigate(`/books/${book._id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="240"
                      image={book.coverImage || PLACEHOLDER_IMAGE}
                      alt={book.title}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {book.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        By {book.author?.name || book.author || 'Unknown Author'}
                      </Typography>
                      {book.isPremium && (
                        <Box 
                          sx={{ 
                            mt: 1, 
                            display: 'inline-block', 
                            bgcolor: 'secondary.main', 
                            color: 'secondary.contrastText',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          Premium
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography variant="body1" align="center" sx={{ my: 4, width: '100%' }}>
                No featured books available at the moment.
              </Typography>
            )}
          </Grid>
        )}
        
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            size="large"
            onClick={() => navigate('/books')}
          >
            View All Books
          </Button>
        </Box>
      </Container>

      {/* Free Books Section */}
      <Container maxWidth="lg" sx={{ mb: 6, mt: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Free Books
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Enjoy our collection of free books - no subscription required!
        </Typography>
        
        {loadingFree ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
            {freeBooks.length > 0 ? (
              freeBooks.map((book) => (
                <Grid item key={book._id} xs={12} sm={6} md={4}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.3s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        cursor: 'pointer'
                      }
                    }}
                    onClick={() => navigate(`/books/${book._id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="240"
                      image={book.coverImage || PLACEHOLDER_IMAGE}
                      alt={book.title}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {book.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        By {book.author?.name || book.author || 'Unknown Author'}
                      </Typography>
                      <Box 
                        sx={{ 
                          mt: 1, 
                          display: 'inline-block', 
                          bgcolor: 'success.main', 
                          color: 'success.contrastText',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}
                      >
                        Free
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography variant="body1" align="center" sx={{ my: 4, width: '100%' }}>
                No free books available at the moment.
              </Typography>
            )}
          </Grid>
        )}
        
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            color="success"
            size="large"
            onClick={() => navigate('/free-books')}
          >
            View All Free Books
          </Button>
        </Box>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom align="center">
            Why Choose Our Library
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Extensive Collection
                </Typography>
                <Typography variant="body1">
                  Access thousands of books across various genres and categories.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Personalized Experience
                </Typography>
                <Typography variant="body1">
                  Keep track of your reading history and manage your favorite books.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Premium Content
                </Typography>
                <Typography variant="body1">
                  Subscribe to access exclusive premium books and features.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 