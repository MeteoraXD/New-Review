import React from 'react';
import { Box, Container, Typography, Grid, Link, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        bgcolor: 'primary.dark',
        color: 'white',
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Book Library
            </Typography>
            <Typography variant="body2">
              Your one-stop destination for all your reading needs.
              Discover, read, and manage your books with ease.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box>
              <Link 
                component={RouterLink} 
                to="/" 
                color="inherit" 
                underline="hover" 
                sx={{ display: 'block', mb: 1 }}
              >
                Home
              </Link>
              <Link 
                component={RouterLink} 
                to="/books" 
                color="inherit" 
                underline="hover" 
                sx={{ display: 'block', mb: 1 }}
              >
                Books
              </Link>
              <Link 
                component={RouterLink} 
                to="/profile" 
                color="inherit" 
                underline="hover" 
                sx={{ display: 'block', mb: 1 }}
              >
                My Profile
              </Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body2" paragraph>
              Email: booksansar@gmail.com
            </Typography>
            <Typography variant="body2">
              Phone: +9779801542371
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Typography variant="body2" align="center">
          © {new Date().getFullYear()} Book Library. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 