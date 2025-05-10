import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { PictureAsPdf, Report, FileDownload, OpenInNew } from '@mui/icons-material';
import { formatPdfUrl } from '../utils/pdfUtils';

class PDFErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('PDF Viewer Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  };

  handleDownload = () => {
    const { pdfUrl, title = 'document' } = this.props;
    
    if (!pdfUrl) {
      console.error('No PDF URL provided for download');
      return;
    }
    
    try {
      const formattedUrl = formatPdfUrl(pdfUrl);
      // Create and click a download link
      const link = document.createElement('a');
      link.href = formattedUrl;
      link.download = `${title}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to window.open
      window.open(formatPdfUrl(pdfUrl), '_blank');
    }
  };

  openInNewTab = () => {
    const { pdfUrl } = this.props;
    
    if (!pdfUrl) {
      console.error('No PDF URL provided to open');
      return;
    }
    
    window.open(formatPdfUrl(pdfUrl), '_blank');
  };

  render() {
    const { children, onBack, pdfUrl, title, showErrorDetails } = this.props;
    
    if (this.state.hasError) {
      return (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            m: 2, 
            maxWidth: 600,
            mx: 'auto',
            textAlign: 'center'
          }}
        >
          <Report color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            PDF Viewer Error
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            There was an error displaying the PDF. You can try again, download the file directly, or go back.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleRetry}
              startIcon={<PictureAsPdf />}
            >
              Try Again
            </Button>
            
            <Button 
              variant="contained" 
              color="success" 
              onClick={this.handleDownload}
              startIcon={<FileDownload />}
            >
              Download PDF
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={this.openInNewTab}
              startIcon={<OpenInNew />}
            >
              Open in New Tab
            </Button>
            
            {onBack && (
              <Button 
                variant="outlined" 
                onClick={onBack}
                color="secondary"
              >
                Go Back
              </Button>
            )}
          </Box>
          
          {showErrorDetails && this.state.error && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'left' }}>
              <Typography variant="subtitle2" color="error">
                Error details:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontSize: '0.75rem'
              }}>
                {this.state.error.toString()}
              </Typography>
              {title && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Book:</strong> {title}
                </Typography>
              )}
              {pdfUrl && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>PDF URL:</strong> {pdfUrl}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      );
    }

    return children;
  }
}

export default PDFErrorBoundary; 