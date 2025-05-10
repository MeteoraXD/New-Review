import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { downloadPdf, testPdfUrl, formatPdfUrl } from '../utils/pdfUtils';
import { API_URL } from '../config/config';

const SimplePDFViewer = ({ pdfUrl, bookTitle, onError, height = '70vh', width = '100%' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const pdfContainerRef = useRef(null);
  const iframeRef = useRef(null);
  const embedRef = useRef(null);
  const objectRef = useRef(null);

  // Format the URL, handling both API and full URLs
  const formattedUrl = pdfUrl ? formatPdfUrl(pdfUrl) : '';

  // Check if we can derive a book ID from the URL for streaming
  const getBookIdFromUrl = () => {
    // Check if URL contains a book ID
    const bookIdMatch = window.location.pathname.match(/\/books\/([a-f0-9]+)/i);
    return bookIdMatch ? bookIdMatch[1] : null;
  };

  // Try to use the streaming endpoint if we have a book ID
  const bookId = getBookIdFromUrl();
  const streamingUrl = bookId ? `${API_URL}/api/books/pdf-stream/${bookId}` : null;

  // Local fallback logic based on book title
  const getLocalFallbackUrl = () => {
    if (!bookTitle) return null;
    // Replace spaces with underscores, convert to lowercase, and add .pdf extension
    const formattedTitle = bookTitle.replace(/\s+/g, '_').toLowerCase() + '.pdf';
    return `/books/${formattedTitle}`;
  };

  const localFallbackUrl = getLocalFallbackUrl();

  // Function to download the PDF
  const handleDownload = async () => {
    // Determine which URL to use, prioritizing the streaming URL
    const urlToUse = streamingUrl || formattedUrl;
    
    try {
      console.log('Attempting to download PDF from:', urlToUse);
      const downloadSuccess = await downloadPdf(urlToUse, bookTitle || 'document');
      
      if (!downloadSuccess) {
        // If the utility function failed, try a direct download approach
        console.log('Utility download failed, trying direct approach');
        tryDirectDownload(urlToUse);
      }
    } catch (error) {
      console.error('Download error:', error);
      
      // Try direct download approach 
      tryDirectDownload(urlToUse);
      
      // If that fails and we have a local fallback, try that
      if (localFallbackUrl) {
        try {
          console.log('Attempting fallback download from:', localFallbackUrl);
          await downloadPdf(localFallbackUrl, bookTitle || 'document');
        } catch (fallbackError) {
          console.error('Fallback download error:', fallbackError);
          tryDirectDownload(localFallbackUrl);
        }
      }
    }
  };

  // Alternative download approach that doesn't rely on the utility
  const tryDirectDownload = (url) => {
    try {
      console.log('Trying direct download with URL:', url);
      
      // Create temporary anchor element for download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bookTitle || 'document'}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      
      // Remove the link after a small delay
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Direct download failed:', error);
      
      // As absolute last resort, just open in new tab
      try {
        window.open(url, '_blank');
      } catch (e) {
        console.error('All download methods failed:', e);
        alert('Unable to download the PDF. Please try again later or check your browser settings.');
      }
      return false;
    }
  };

  // Function to clean up current viewer elements
  const cleanupCurrentViewer = useCallback(() => {
    if (!pdfContainerRef.current) {
      console.log('PDF container reference is null, nothing to clean up');
      return;
    }
    
    try {
      // Properly remove elements
      if (iframeRef.current && iframeRef.current.parentNode) {
        try {
          iframeRef.current.parentNode.removeChild(iframeRef.current);
        } catch (e) {
          console.error('Error removing iframe:', e);
        }
      }
      
      if (embedRef.current && embedRef.current.parentNode) {
        try {
          embedRef.current.parentNode.removeChild(embedRef.current);
        } catch (e) {
          console.error('Error removing embed:', e);
        }
      }
      
      if (objectRef.current && objectRef.current.parentNode) {
        try {
          objectRef.current.parentNode.removeChild(objectRef.current);
        } catch (e) {
          console.error('Error removing object:', e);
        }
      }
      
      // Reset refs
      iframeRef.current = null;
      embedRef.current = null;
      objectRef.current = null;
      
      // Safely remove any remaining children
      try {
        while (pdfContainerRef.current && pdfContainerRef.current.firstChild) {
          pdfContainerRef.current.removeChild(pdfContainerRef.current.firstChild);
        }
      } catch (error) {
        console.error('Error removing container children:', error);
        // As a last resort, if the safe method fails
        if (pdfContainerRef.current) {
          pdfContainerRef.current.innerHTML = '';
        }
      }
    } catch (error) {
      console.error('Error cleaning up viewer:', error);
    }
  }, []);

  // Handle local fallback
  const handleLocalFallback = () => {
    if (!localFallbackUrl) return;
    
    setIsLoading(true);
    setLoadError(false);
    loadPdfWithUrl(localFallbackUrl);
  };

  // Function for trying alternatives
  const tryAlternativeViewer = useCallback(() => {
    console.log('Trying alternative viewer method');
    setIsLoading(true);
    setLoadError(false);
    
    if (streamingUrl) {
      console.log('Trying streaming URL:', streamingUrl);
      loadPdfWithUrl(streamingUrl);
    } else if (localFallbackUrl) {
      console.log('Trying local fallback URL:', localFallbackUrl);
      loadPdfWithUrl(localFallbackUrl);
    } else {
      setIsLoading(false);
      setLoadError(true);
      if (onError) onError(new Error('PDF loading failed - no fallback available'));
    }
  }, [streamingUrl, localFallbackUrl, onError]);

  // Function to collect debug information
  const collectDebugInfo = useCallback(async () => {
    const info = {
      timestamp: new Date().toISOString(),
      pdfUrl: formattedUrl,
      streamingUrl: streamingUrl,
      localFallbackUrl: localFallbackUrl,
      bookTitle: bookTitle || 'Not provided',
      bookId: bookId || 'Not available',
      browserInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
      },
      viewportDimensions: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      containerDimensions: pdfContainerRef.current ? {
        width: pdfContainerRef.current.clientWidth,
        height: pdfContainerRef.current.clientHeight,
      } : 'Container not available',
      loadState: {
        isLoading,
        loadError,
      }
    };
    
    // Test if the PDF URL is accessible
    try {
      info.urlTestResult = { success: await testPdfUrl(formattedUrl) };
    } catch (error) {
      info.urlTestResult = {
        success: false,
        error: error.message,
      };
    }
    
    // Test if the streaming URL is accessible (if it exists)
    if (streamingUrl) {
      try {
        info.streamingUrlTestResult = { success: await testPdfUrl(streamingUrl) };
      } catch (error) {
        info.streamingUrlTestResult = {
          success: false,
          error: error.message,
        };
      }
    }
    
    // Test if the local fallback URL is accessible (if it exists)
    if (localFallbackUrl) {
      try {
        info.localUrlTestResult = { success: await testPdfUrl(localFallbackUrl) };
      } catch (error) {
        info.localUrlTestResult = {
          success: false,
          error: error.message,
        };
      }
    }
    
    console.log('Debug info:', info);
    setDebugInfo(info);
    setShowDebugDialog(true);
  }, [formattedUrl, streamingUrl, localFallbackUrl, bookTitle, bookId, isLoading, loadError]);

  // Load PDF with a specific URL
  const loadPdfWithUrl = useCallback((url) => {
    if (!pdfContainerRef.current) {
      console.error('PDF container reference is null, cannot load PDF');
      setIsLoading(false);
      setLoadError(true);
      if (onError) onError(new Error('PDF container not available'));
      return;
    }
    
    console.log('Loading PDF with URL:', url);
    setIsLoading(true);
    setLoadError(false);
    
    // Clean up any existing viewers
    cleanupCurrentViewer();
    
    // Function to try object tag
    const tryObjectTag = () => {
      // Double-check container still exists
      if (!pdfContainerRef.current) {
        console.error('PDF container reference is null in tryObjectTag');
        setIsLoading(false);
        setLoadError(true);
        return;
      }
      
      console.log('Trying to load PDF with Object tag');
      
      // Create object element using DOM methods
      const objElement = document.createElement('object');
      objElement.type = 'application/pdf';
      objElement.data = url;
      objElement.width = '100%';
      objElement.height = '100%';
      
      // Add fallback text inside object
      const fallbackText = document.createElement('p');
      fallbackText.textContent = 'Your browser does not support PDFs. Please download the PDF to view it.';
      objElement.appendChild(fallbackText);
      
      // Add download link as fallback
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.textContent = 'Download PDF';
      downloadLink.target = '_blank';
      downloadLink.rel = 'noopener noreferrer';
      objElement.appendChild(downloadLink);
      
      // Set load and error events
      objElement.onload = () => {
        console.log('Object element loaded');
        setIsLoading(false);
      };
      
      objElement.onerror = () => {
        console.error('Object element failed to load');
        if (pdfContainerRef.current) {
          loadIframeFallback();
        } else {
          showErrorMessage('PDF container no longer available');
        }
      };
      
      // Store reference and append to container
      objectRef.current = objElement;
      pdfContainerRef.current.appendChild(objElement);
      
      // Set a timeout to check if loading worked
      setTimeout(() => {
        if (isLoading && !loadError && pdfContainerRef.current) {
          console.log('Object loading timeout, trying iframe...');
          loadIframeFallback();
        }
      }, 3000);
    };
    
    // Function to load iframe as fallback
    const loadIframeFallback = () => {
      // Double-check container still exists
      if (!pdfContainerRef.current) {
        console.error('PDF container reference is null in loadIframeFallback');
        setIsLoading(false);
        setLoadError(true);
        return;
      }
      
      console.log('Trying to load PDF with iframe');
      
      // Clean container first
      if (objectRef.current && objectRef.current.parentNode) {
        objectRef.current.parentNode.removeChild(objectRef.current);
        objectRef.current = null;
      }
      
      // Create iframe using DOM methods
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.style.border = 'none';
      iframe.title = 'PDF Viewer';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
      iframe.setAttribute('loading', 'lazy');
      
      // Set load and error events
      iframe.onload = () => {
        console.log('iframe loaded successfully');
        setIsLoading(false);
      };
      
      iframe.onerror = (error) => {
        console.error('iframe failed to load', error);
        showErrorMessage('PDF could not be loaded due to browser restrictions or CORS issues.');
      };
      
      try {
        // Store reference and append to container only if it still exists
        if (pdfContainerRef.current) {
          iframeRef.current = iframe;
          pdfContainerRef.current.appendChild(iframe);
          
          // Set a timeout to check if loading worked
          setTimeout(() => {
            if (isLoading && !loadError && pdfContainerRef.current) {
              showErrorMessage('PDF is taking too long to load or has encountered a problem.');
            }
          }, 5000);
        } else {
          showErrorMessage('PDF container no longer available');
        }
      } catch (error) {
        console.error('Error appending iframe:', error);
        showErrorMessage('Error displaying PDF viewer');
      }
    };
    
    // Function to show error and call onError callback
    const showErrorMessage = (message) => {
      console.error(message);
      setIsLoading(false);
      setLoadError(true);
      if (onError) onError(new Error(message));
    };
    
    // Start with object tag method
    try {
      tryObjectTag();
    } catch (error) {
      console.error('Error in tryObjectTag:', error);
      showErrorMessage('Failed to initialize PDF viewer');
    }
  }, [isLoading, loadError, onError, cleanupCurrentViewer]);

  // Initial load
  useEffect(() => {
    // Only proceed if the component is still mounted and refs are available
    if (!pdfContainerRef.current) {
      console.error('PDF container ref not available on initial load');
      setIsLoading(false);
      setLoadError(true);
      if (onError) onError(new Error('PDF container not available'));
      return;
    }
    
    if (!formattedUrl) {
      console.error('No PDF URL provided');
      setIsLoading(false);
      setLoadError(true);
      if (onError) onError(new Error('No PDF URL provided'));
      return;
    }
    
    console.log('Initial PDF load with URL:', formattedUrl);
    
    // Create a flag to track if component is still mounted
    let isMounted = true;
    
    // Use a try-catch block to handle any unexpected errors
    try {
      loadPdfWithUrl(formattedUrl);
    } catch (error) {
      console.error('Error during initial PDF load:', error);
      if (isMounted) {
        setIsLoading(false);
        setLoadError(true);
        if (onError) onError(error);
      }
    }
    
    // Cleanup function runs when component unmounts
    return () => {
      isMounted = false;
      console.log('Cleaning up PDF viewer');
      try {
        cleanupCurrentViewer();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, [formattedUrl, loadPdfWithUrl, onError, cleanupCurrentViewer]);

  return (
    <Box sx={{ width, height, position: 'relative' }}>
      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading PDF...
          </Typography>
        </Box>
      )}
      
      {/* Error message */}
      {loadError && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: '500px'
        }}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              Unable to load PDF
            </Typography>
            
            <Typography variant="body2" paragraph>
              There was an error loading the PDF. This could be due to browser restrictions or connection issues.
            </Typography>
            
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {localFallbackUrl && (
                <Button 
                  variant="outlined" 
                  startIcon={<SettingsBackupRestoreIcon />} 
                  onClick={handleLocalFallback}
                >
                  Try Local Copy
                </Button>
              )}
              
              <Button 
                variant="outlined" 
                startIcon={<FileDownloadIcon />} 
                onClick={handleDownload}
              >
                Download PDF Instead
              </Button>
              
              <Button 
                variant="text" 
                startIcon={<BugReportIcon />} 
                onClick={collectDebugInfo}
                size="small"
                sx={{ mt: 1 }}
              >
                Show Debug Info
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      
      {/* PDF Container */}
      <Box 
        ref={pdfContainerRef} 
        sx={{ 
          width: '100%', 
          height: '100%',
          bgcolor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden'
        }}
      />
      
      {/* Debug Dialog */}
      <Dialog 
        open={showDebugDialog} 
        onClose={() => setShowDebugDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          PDF Loading Diagnostic Information
          <IconButton
            aria-label="close"
            onClick={() => setShowDebugDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            PDF Loading Status
          </Typography>
          
          <Alert severity={loadError ? "error" : "info"} sx={{ mb: 2 }}>
            {loadError 
              ? "PDF loading encountered an error" 
              : isLoading 
                ? "PDF is currently loading" 
                : "PDF loaded successfully"
            }
          </Alert>
          
          <Typography variant="subtitle1" gutterBottom>
            Server File Check
          </Typography>
          
          {debugInfo.urlTestResult ? (
            <Alert severity={debugInfo.urlTestResult.success ? "success" : "error"} sx={{ mb: 2 }}>
              {debugInfo.urlTestResult.success 
                ? "Server PDF file is accessible" 
                : `Server PDF file check failed: ${debugInfo.urlTestResult.error || 'Unknown error'}`
              }
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Server PDF file check not completed
            </Alert>
          )}
          
          {debugInfo.streamingUrlTestResult && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Streaming URL Check
              </Typography>
              
              <Alert severity={debugInfo.streamingUrlTestResult.success ? "success" : "error"} sx={{ mb: 2 }}>
                {debugInfo.streamingUrlTestResult.success 
                  ? "Streaming URL is accessible" 
                  : `Streaming URL check failed: ${debugInfo.streamingUrlTestResult.error || 'Unknown error'}`
                }
              </Alert>
            </>
          )}
          
          {debugInfo.localUrlTestResult && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Local File Check
              </Typography>
              
              <Alert severity={debugInfo.localUrlTestResult.success ? "success" : "error"} sx={{ mb: 2 }}>
                {debugInfo.localUrlTestResult.success 
                  ? "Local PDF file is accessible" 
                  : `Local PDF file check failed: ${debugInfo.localUrlTestResult.error || 'Unknown error'}`
                }
              </Alert>
            </>
          )}
          
          <Typography variant="subtitle1" gutterBottom>
            URL Information
          </Typography>
          
          <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, wordBreak: 'break-all' }}>
            <Typography variant="body2">
              <strong>Server URL:</strong> {formattedUrl}
            </Typography>
            
            {streamingUrl && (
              <Typography variant="body2">
                <strong>Streaming URL:</strong> {streamingUrl}
              </Typography>
            )}
            
            {localFallbackUrl && (
              <Typography variant="body2">
                <strong>Local Fallback URL:</strong> {localFallbackUrl}
              </Typography>
            )}
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Browser Information
          </Typography>
          
          <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            {debugInfo.browserInfo && Object.entries(debugInfo.browserInfo).map(([key, value]) => (
              <Typography key={key} variant="body2">
                <strong>{key}:</strong> {value.toString()}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            startIcon={<FileDownloadIcon />} 
            onClick={handleDownload}
          >
            Download PDF
          </Button>
          <Button onClick={() => setShowDebugDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimplePDFViewer; 