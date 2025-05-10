import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ReportProblem as ErrorIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
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
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { children, fallback } = this.props;
    
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (fallback) {
        return fallback;
      }
      
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
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 2 }}>
            There was an error rendering this component. You can try again or go back.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleRetry}
            >
              Try Again
            </Button>
            {this.props.onBack && (
              <Button 
                variant="outlined" 
                onClick={this.props.onBack}
              >
                Go Back
              </Button>
            )}
          </Box>
          {this.props.showErrorDetails && this.state.error && (
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
            </Box>
          )}
        </Paper>
      );
    }

    return children;
  }
}

export default ErrorBoundary; 