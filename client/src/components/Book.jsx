import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Rating,
  Box,
  Chip
} from '@mui/material';
import { Favorite, FavoriteBorder, Lock } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Book = ({ book, isFavorite, onToggleFavorite, showRating = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Default image placeholder if no cover image is available
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23aaa' text-anchor='middle' dominant-baseline='middle'%3ENo Cover%3C/text%3E%3C/svg%3E";
  
  // Check if the user has access to premium content
  const hasPremiumAccess = user && (user.role === 'admin' || user.role === 'author' || user.membership === 'premium');
  
  const handleFavoriteClick = async () => {
    try {
      const response = await fetch(`/api/auth/favorites/${book._id}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update favorites');
      }

      onToggleFavorite(book._id);
      toast.success(isFavorite ? 'Book removed from favorites' : 'Book added to favorites');
    } catch (error) {
      toast.error('Failed to update favorites');
      console.error('Favorite toggle error:', error);
    }
  };

  const handleClick = () => {
    navigate(`/books/${book._id || book.id}`);
  };

  return (
    <Card 
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
        },
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      {/* Premium content indicator */}
      {book.isPremium && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            right: 10, 
            zIndex: 1,
            bgcolor: hasPremiumAccess ? 'secondary.main' : 'grey.500',
            color: 'white',
            borderRadius: '4px',
            px: 1,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          {hasPremiumAccess ? 'PREMIUM' : <Lock fontSize="small" />}
        </Box>
      )}
      
      {/* Book cover */}
      <CardMedia
        component="img"
        image={book.coverImage || defaultImage}
        alt={book.title}
        sx={{ 
          height: 280, 
          objectFit: 'cover',
          filter: (book.isPremium && !hasPremiumAccess) ? 'blur(3px) brightness(0.7)' : 'none'
        }}
      />
      
      {/* Book info */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.3em',
              height: '2.6em'
            }}
          >
            {book.title}
          </Typography>
          <IconButton 
            size="small" 
            onClick={handleFavoriteClick}
            color={isFavorite ? "error" : "default"}
          >
            {isFavorite ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          By {book.author && typeof book.author === 'object' ? book.author.name : book.author || 'Unknown Author'}
        </Typography>
        
        {showRating && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
            <Rating 
              value={book.rating || 0} 
              precision={0.5} 
              size="small" 
              readOnly 
              sx={{ mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {book.rating ? book.rating.toFixed(1) : 'No ratings'}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {book.category && (
            <Chip 
              label={book.category} 
              size="small" 
              sx={{ fontSize: '0.7rem' }}
            />
          )}
          
          {book.publishedYear && (
            <Chip 
              label={book.publishedYear} 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default Book; 