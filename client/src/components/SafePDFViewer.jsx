import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress,
  Paper,
  Link
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { formatPdfUrl, testPdfUrl } from '../utils/pdfUtils';

/**
 * A PDF viewer component that safely displays PDFs or offers download options
 * when embedding is blocked by Content Security Policy restrictions
 */
const SafePDFViewer = ({ pdfUrl, title, height = '70vh' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [urlChecked, setUrlChecked] = useState(false);
  const viewerRef = useRef(null);
  
  // Format the provided URL
  const formattedUrl = formatPdfUrl(pdfUrl || '');
  
  // Handle download click
  const handleDownload = () => {
    try {
      // Create and click a download link
      const link = document.createElement('a');
      link.href = formattedUrl;
      link.download = `${title || 'document'}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      // Open in new tab as fallback
      window.open(formattedUrl, '_blank');
    }
  };
  
  // First check if URL is accessible directly
  useEffect(() => {
    if (!formattedUrl) {
      setError(true);
      setLoading(false);
      return;
    }
    
    let isMounted = true;
    
    const checkDirectUrl = async () => {
      try {
        console.log('Performing initial URL check for PDF accessibility');
        
        // Create a controller to abort the request if it takes too long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Try a simple HEAD request first
        const response = await fetch(formattedUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (isMounted) {
          console.log('URL check completed, proceeding with viewer');
          setUrlChecked(true);
        }
      } catch (error) {
        console.log('URL check failed, might be a CORS issue:', error);
        if (error.name === 'AbortError') {
          console.log('URL check timed out');
        }
        
        if (isMounted) {
          // If there's an error, still proceed to try the viewers
          // as they might work even if direct fetch fails
          setUrlChecked(true);
        }
      }
    };
    
    checkDirectUrl();
    
    return () => {
      isMounted = false;
    };
  }, [formattedUrl]);
  
  // Track CSP errors
  useEffect(() => {
    const handleError = (event) => {
      // Check for CSP and frame ancestor errors
      if (
        event.message && 
        (event.message.includes('Content Security Policy') || 
         event.message.includes('frame-ancestors') ||
         event.message.includes('Refused to frame'))
      ) {
        console.log('CSP error detected, switching to fallback mode');
        setFallbackMode(true);
        setLoading(false);
      }
    };
    
    // Listen for CSP errors
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Try different methods to display PDF
  useEffect(() => {
    if (!formattedUrl || !viewerRef.current || !urlChecked) {
      return; // Wait until URL check is complete
    }

    let isMounted = true;
    const container = viewerRef.current;
    let embedTimer, objTimer, iframeTimer;
    
    // Clean up function to remove elements
    const cleanup = () => {
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
      
      clearTimeout(embedTimer);
      clearTimeout(objTimer);
      clearTimeout(iframeTimer);
    };

    // Track if any viewer loaded successfully
    let viewerLoadedSuccessfully = false;

    // Try to render with embed element first (better compatibility)
    const tryEmbedElement = () => {
      try {
        console.log('Trying to load PDF with embed element');
        cleanup();
        
        if (!isMounted) return;
        
        const embed = document.createElement('embed');
        embed.src = formattedUrl;
        embed.type = 'application/pdf';
        embed.width = '100%';
        embed.height = '100%';
        embed.style.border = 'none';
        
        // Add event listeners if possible
        embed.addEventListener('load', () => {
          if (isMounted) {
            console.log('Embed element loaded successfully');
            viewerLoadedSuccessfully = true;
            setLoading(false);
          }
        });
        
        // Some browsers don't fire load event for embeds
        container.appendChild(embed);
        
        // Give embed more time to load (7 seconds)
        embedTimer = setTimeout(() => {
          if (isMounted && loading && !viewerLoadedSuccessfully) {
            console.log('Embed element timed out, trying object element');
            tryObjectElement();
          }
        }, 7000);
      } catch (error) {
        console.error('Error with embed element:', error);
        if (isMounted) {
          tryObjectElement();
        }
      }
    };
    
    // Try object element as fallback
    const tryObjectElement = () => {
      try {
        console.log('Trying to load PDF with object element');
        cleanup();
        
        if (!isMounted) return;
        
        const obj = document.createElement('object');
        obj.data = formattedUrl;
        obj.type = 'application/pdf';
        obj.width = '100%';
        obj.height = '100%';
        
        // Fallback content inside object tag
        const fallbackText = document.createElement('p');
        fallbackText.textContent = 'PDF cannot be displayed. Please use the download option below.';
        obj.appendChild(fallbackText);
        
        obj.onload = () => {
          if (isMounted) {
            console.log('Object element loaded successfully');
            viewerLoadedSuccessfully = true;
            setLoading(false);
          }
        };
        
        obj.onerror = () => {
          if (isMounted) {
            console.error('Object element failed, trying iframe');
            tryIframeElement();
          }
        };
        
        container.appendChild(obj);
        
        // Give object more time to load (7 seconds)
        objTimer = setTimeout(() => {
          if (isMounted && loading && !viewerLoadedSuccessfully) {
            console.log('Object element timed out, trying iframe');
            tryIframeElement();
          }
        }, 7000);
      } catch (error) {
        console.error('Error with object element:', error);
        if (isMounted) {
          tryIframeElement();
        }
      }
    };
    
    // Final attempt with iframe
    const tryIframeElement = () => {
      try {
        console.log('Trying to load PDF with iframe element');
        cleanup();
        
        if (!isMounted) return;
        
        const iframe = document.createElement('iframe');
        iframe.src = formattedUrl;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.style.border = 'none';
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');
        
        iframe.onload = () => {
          if (isMounted) {
            console.log('iframe loaded successfully');
            viewerLoadedSuccessfully = true;
            setLoading(false);
          }
        };
        
        iframe.onerror = () => {
          if (isMounted) {
            console.error('iframe failed to load');
            setFallbackMode(true);
            setLoading(false);
          }
        };
        
        container.appendChild(iframe);
        
        // Check iframe document access using polling
        let attempts = 0;
        const checkIframeInterval = setInterval(() => {
          attempts++;
          
          try {
            // Try to access iframe content as a test for CORS restrictions
            if (iframe.contentDocument || iframe.contentWindow?.document) {
              // If we can access the document, the PDF might be loading
              clearInterval(checkIframeInterval);
            }
          } catch (e) {
            // CORS error - iframe restricted
            if (e.name === 'SecurityError' || e.name === 'InvalidAccessError') {
              console.log('CORS restriction detected in iframe');
              clearInterval(checkIframeInterval);
              if (isMounted) {
                setFallbackMode(true);
                setLoading(false);
              }
            }
          }
          
          // Stop trying after 10 attempts
          if (attempts >= 10) {
            clearInterval(checkIframeInterval);
          }
        }, 500);
        
        // Final fallback timer (10 seconds)
        iframeTimer = setTimeout(() => {
          clearInterval(checkIframeInterval);
          if (isMounted && loading && !viewerLoadedSuccessfully) {
            console.log('PDF loading timed out after all attempts');
            setFallbackMode(true);
            setLoading(false);
          }
        }, 10000);
      } catch (error) {
        console.error('All PDF loading methods failed:', error);
        if (isMounted) {
          setFallbackMode(true);
          setLoading(false);
        }
      }
    };

    // Start the chain of attempts
    tryEmbedElement();
    
    // Cleanup function
    return () => {
      isMounted = false;
      cleanup();
    };
  }, [formattedUrl, urlChecked, loading]);
  
  // Render fallback UI with download options
  if (fallbackMode || error) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
          borderRadius: 1,
          p: 3
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            maxWidth: 500, 
            width: '100%', 
            textAlign: 'center' 
          }}
        >
          <Typography variant="h6" gutterBottom>
            Unable to display PDF
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            The PDF cannot be displayed directly in the browser due to security restrictions.
            Please use one of the options below to view the document.
          </Typography>
          
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownload}
              fullWidth
            >
              Download PDF
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              component={Link}
              href={formattedUrl}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
            >
              Open in New Tab
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
  
  // Try to render the PDF using progressive enhancement
  return (
    <Box 
      sx={{ 
        height, 
        position: 'relative',
        bgcolor: '#f5f5f5',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            bgcolor: 'rgba(255,255,255,0.7)',
            zIndex: 10
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading PDF...
          </Typography>
        </Box>
      )}
      
      {/* PDF container where elements will be dynamically added */}
      <Box 
        ref={viewerRef}
        sx={{ 
          width: '100%', 
          height: '100%',
          border: '1px solid #e0e0e0',
          borderRadius: 1
        }}
      />
    </Box>
  );
};

export default SafePDFViewer; 