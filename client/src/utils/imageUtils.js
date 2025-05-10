/**
 * Image utility functions
 */

// Base64-encoded SVG for a book cover placeholder
export const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EBook Cover%3C/text%3E%3C/svg%3E";

// Base64-encoded SVG for an error placeholder
export const ERROR_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='16' fill='%23e74c3c' text-anchor='middle' dominant-baseline='middle'%3EImage Error%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='12' fill='%23e74c3c' text-anchor='middle' dominant-baseline='middle'%3ECould not load image%3C/text%3E%3C/svg%3E";

/**
 * Validates if a string is a valid image URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is valid, false otherwise
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  
  // Check if it's a data URL for SVG or other formats
  if (url.startsWith('data:image/')) return true;

  // Check if it has a valid URL pattern and common image extensions
  const urlPattern = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/[a-z0-9-_.~:/?#[\]@!$&'()*+,;=]*)?$/i;
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i;
  
  return urlPattern.test(url) && (
    // Either ends with an image extension or we'll assume it's valid
    // (some URLs might be API endpoints that don't have extensions)
    imageExtensions.test(url) || 
    url.includes('/image') || 
    url.includes('/img') ||
    url.includes('/photo')
  );
};

/**
 * Generate a placeholder image for a book with text
 * @param {string} text - Text to display on the placeholder
 * @param {number} width - Width of the image
 * @param {number} height - Height of the image
 * @param {string} bgColor - Background color (hex code)
 * @param {string} textColor - Text color (hex code)
 * @returns {string} - Base64 encoded SVG image
 */
export const generatePlaceholder = (text, width = 200, height = 300, bgColor = '#f0f0f0', textColor = '#333') => {
  // Encode the colors and text to be URL-safe
  const encodedBgColor = encodeURIComponent(bgColor);
  const encodedTextColor = encodeURIComponent(textColor);
  const encodedText = encodeURIComponent(text || 'Book Cover');
  
  // Generate the SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${encodedBgColor}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="16" fill="${encodedTextColor}" text-anchor="middle" dominant-baseline="middle">${encodedText}</text>
    </svg>
  `.trim();
  
  // Convert to a data URL
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/**
 * Handle image loading errors
 * @param {Event} event - The error event
 */
export const handleImageError = (event) => {
  console.warn('Image failed to load, using fallback:', event.target.src);
  event.target.src = ERROR_IMAGE;
  event.target.onerror = null; // Prevent infinite loop
};

/**
 * Generate a random color
 * @returns {string} - Hex color code
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Generate a book cover placeholder with author and title
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @returns {string} - Data URL for the SVG image
 */
export const generateBookCoverPlaceholder = (title, author) => {
  // Use the first character of the title for a background color
  const firstChar = (title || '').charAt(0).toUpperCase();
  const colorCode = firstChar.charCodeAt(0) % 10;
  
  // Color palette for book covers
  const colorPalette = [
    '#3498db', // Blue
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Turquoise
    '#34495e', // Dark Blue
    '#d35400', // Dark Orange
    '#27ae60', // Dark Green
    '#8e44ad'  // Dark Purple
  ];
  
  const bgColor = colorPalette[colorCode];
  const textColor = '#ffffff';
  
  // Create a shortened version of the title if it's too long
  const shortenedTitle = title && title.length > 20 
    ? title.substring(0, 17) + '...' 
    : title || 'Untitled';
  
  // Create a shortened version of the author if it's too long
  const shortenedAuthor = author && author.length > 20
    ? author.substring(0, 17) + '...'
    : author || 'Unknown Author';
  
  // Create the SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
      <rect width="200" height="300" fill="${bgColor}"/>
      <rect x="10" y="10" width="180" height="280" fill="${bgColor}" stroke="#ffffff" stroke-width="2"/>
      <text x="100" y="150" font-family="Arial" font-size="16" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${shortenedTitle}</text>
      <text x="100" y="180" font-family="Arial" font-size="14" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">by ${shortenedAuthor}</text>
    </svg>
  `.trim();
  
  // Convert to a data URL
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export default {
  PLACEHOLDER_IMAGE,
  ERROR_IMAGE,
  handleImageError,
  generatePlaceholder,
  generateBookCoverPlaceholder,
  isValidImageUrl
}; 