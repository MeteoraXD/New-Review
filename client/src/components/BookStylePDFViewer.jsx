import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, IconButton, Paper, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { NavigateNext, NavigateBefore, ZoomIn, ZoomOut, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ViewerContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1300,
}));

const BookContainer = styled(Paper)(({ theme }) => ({
  width: '90%',
  height: '90%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
}));

const Controls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  transform: 'translateY(-50%)',
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(2),
  zIndex: 1,
}));

const ZoomControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(1),
  zIndex: 1,
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  left: theme.spacing(1),
  zIndex: 1,
}));

const PageContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
}));

const BookStylePDFViewer = ({ pdfUrl, bookTitle, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  };

  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages]);

  if (loading) {
    return (
      <ViewerContainer>
        <Typography>Loading PDF...</Typography>
      </ViewerContainer>
    );
  }

  if (error) {
    return (
      <ViewerContainer>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <IconButton onClick={onClose} sx={{ mt: 2 }}>
            <Close />
          </IconButton>
        </Paper>
      </ViewerContainer>
    );
  }

  return (
    <ViewerContainer>
      <BookContainer>
        <CloseButton onClick={onClose}>
          <Close />
        </CloseButton>
        
        <Typography variant="h6" sx={{ p: 2, textAlign: 'center' }}>
          {bookTitle}
        </Typography>

        <PageContainer>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<Typography>Loading PDF...</Typography>}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </PageContainer>

        <Controls>
          <IconButton
            onClick={handlePreviousPage}
            disabled={pageNumber <= 1}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
          >
            <NavigateBefore />
          </IconButton>
          <IconButton
            onClick={handleNextPage}
            disabled={pageNumber >= numPages}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
          >
            <NavigateNext />
          </IconButton>
        </Controls>

        <ZoomControls>
          <IconButton onClick={handleZoomOut} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
            <ZoomOut />
          </IconButton>
          <IconButton onClick={handleZoomIn} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
            <ZoomIn />
          </IconButton>
        </ZoomControls>

        <Typography sx={{ p: 2, textAlign: 'center' }}>
          Page {pageNumber} of {numPages}
        </Typography>
      </BookContainer>
    </ViewerContainer>
  );
};

export default BookStylePDFViewer; 