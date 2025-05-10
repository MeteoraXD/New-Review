/**
 * PDF Utility Functions
 * 
 * Contains helper functions for working with PDFs in the application
 */

/**
 * Formats a PDF URL to ensure it's properly formatted for loading
 * @param {string} url - The PDF URL to format
 * @returns {string} - The formatted URL
 */
export const formatPdfUrl = (url) => {
  if (!url) return null;

  // If it's already an absolute URL, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // If the URL starts with a slash, append it to the backend URL
    if (url.startsWith('/')) {
      return `http://localhost:5000${url}`;
    }
    // If it doesn't start with a slash, add one
    return `http://localhost:5000/${url}`;
  }

  // For production, use relative URLs
  return url.startsWith('/') ? url : `/${url}`;
};

/**
 * Tests if a PDF URL is accessible
 * @param {string} url - The PDF URL to test
 * @returns {Promise<boolean>} - Promise resolving to true if the PDF is accessible
 */
export const testPdfUrl = async (url) => {
  if (!url) return false;
  
  const formattedUrl = formatPdfUrl(url);
  console.log('Testing PDF URL access:', formattedUrl);
  
  try {
    // Use a timeout to prevent long-hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    // Try to fetch the PDF headers to see if it exists - with CORS handling
    const response = await fetch(formattedUrl, {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal,
      headers: {
        'Accept': 'application/pdf'
      },
      mode: 'cors', // Try with CORS first
      credentials: 'omit' // Don't send credentials
    });
    
    clearTimeout(timeoutId); // Clear the timeout
    
    // Check if the response is ok (status 200-299)
    if (response.ok) {
      console.log('PDF URL is accessible:', formattedUrl);
      return true;
    }
    
    // If not successful, try a GET request instead of HEAD (some servers don't support HEAD)
    console.log('HEAD request failed, trying GET request instead');
    const getController = new AbortController();
    const getTimeoutId = setTimeout(() => getController.abort(), 5000);
    
    const getResponse = await fetch(formattedUrl, {
      method: 'GET',
      cache: 'no-cache',
      signal: getController.signal,
      headers: {
        'Accept': 'application/pdf',
        'Range': 'bytes=0-1023' // Only get the first 1KB to check if it exists
      },
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(getTimeoutId);
    
    if (getResponse.ok) {
      console.log('PDF URL is accessible via GET:', formattedUrl);
      return true;
    }
    
    console.error('PDF URL is not accessible:', formattedUrl, getResponse.status);
    return false;
  } catch (error) {
    // Check for CORS errors specifically
    if (error.toString().includes('CORS') || error.toString().includes('NetworkError')) {
      console.log('CORS or network error when testing PDF URL. Will attempt to load it anyway:', error);
      return true; // Still return true as the PDF might be accessible via iframe/object
    }
    
    console.error('Error testing PDF URL:', error);
    // Despite the error, return true to allow the PDF viewer to try loading it anyway
    // This helps in cases where the fetch fails but the PDF is actually accessible
    return true;
  }
};

/**
 * Creates a download link for a PDF
 * @param {string} url - The PDF URL
 * @param {string} filename - The filename to use for download
 */
export const downloadPdf = (url, filename = 'document.pdf') => {
  try {
    // Format the URL
    const formattedUrl = formatPdfUrl(url);
    console.log('Downloading PDF from:', formattedUrl);
    
    // First try the most reliable method
    window.open(formattedUrl, '_blank');
    return true;
  } catch (error) {
    console.error('Error with window.open download:', error);
    
    // Fallback: try creating a link without DOM manipulation
    try {
      const link = document.createElement('a');
      link.href = formatPdfUrl(url);
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Avoid DOM manipulation completely by just clicking the link
      link.style.display = 'none';
      link.click();
      return true;
    } catch (fallbackError) {
      console.error('All download methods failed:', fallbackError);
      return false;
    }
  }
}; 