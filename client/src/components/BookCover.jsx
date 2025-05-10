import React, { useState } from 'react';
import { Box } from '@mui/material';
import { 
  PLACEHOLDER_IMAGE, 
  ERROR_IMAGE,
  generateBookCoverPlaceholder 
} from '../utils/imageUtils';

// Hard-coded inline SVG for maximum reliability
const FallbackCover = ({ title, author }) => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#f0f0f0',
      color: '#666',
      p: 2,
      textAlign: 'center'
    }}
  >
    <svg
      width="50"
      height="50"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 4H3C1.9 4 1 4.9 1 6V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V6C23 4.9 22.1 4 21 4Z"
        stroke="#999"
        strokeWidth="2"
      />
      <path
        d="M1 10H23"
        stroke="#999"
        strokeWidth="2"
      />
    </svg>
    <Box sx={{ mt: 2, fontWeight: 'bold', fontSize: '1rem' }}>
      {title || 'Book Cover'}
    </Box>
    {author && (
      <Box sx={{ mt: 1, fontSize: '0.8rem' }}>
        by {author}
      </Box>
    )}
  </Box>
);

const BookCover = ({ imageUrl, title, author, alt, height = 300, ...props }) => {
  const [imageError, setImageError] = useState(false);

  // Check if imageUrl is problematic
  const isInvalidImageUrl = !imageUrl || 
    (typeof imageUrl === 'string' && (
      imageUrl === '/images/placeholder.svg' ||
      imageUrl === 'placeholder.svg' ||
      imageUrl.includes('placeholder.com') ||
      imageUrl.includes('500x700')
    ));

  // Generate a custom cover if needed
  const placeholderImage = generateBookCoverPlaceholder(title, author);

  const handleImageError = () => {
    console.log('Image failed to load:', imageUrl);
    setImageError(true);
  };

  // Fix placeholder URLs by adding https:// if missing
  const fixedImageUrl = imageUrl && typeof imageUrl === 'string' && imageUrl.includes('placeholder.com') && !imageUrl.includes('https://') 
    ? `https://${imageUrl}` 
    : imageUrl;

  // Show custom generated cover immediately if URL is invalid
  if (isInvalidImageUrl || imageError) {
    return (
      <Box
        sx={{
          width: '100%',
          height: height,
          position: 'relative',
          overflow: 'hidden',
          ...props.sx
        }}
      >
        <img
          src={placeholderImage}
          alt={alt || title || 'Book cover'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: height,
        position: 'relative',
        overflow: 'hidden',
        ...props.sx
      }}
    >
      <img
        src={fixedImageUrl}
        alt={alt || title || 'Book cover'}
        onError={handleImageError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </Box>
  );
};

export default BookCover; 