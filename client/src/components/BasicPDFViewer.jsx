import React, { useState } from 'react';
import { Box, IconButton, Typography, CircularProgress, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';

/**
 * A realistic book viewer component with page turning animations
 * Provides an immersive reading experience
 */

const BasicPDFViewer = ({ pdfUrl, onClose, title }) => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleIframeLoad = () => {
        setLoading(false);
    };

    const handleIframeError = () => {
        setError('Failed to load PDF. Please try again.');
        setLoading(false);
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
    };

    // Format URL if needed
    const formattedUrl = pdfUrl.startsWith('/') 
        ? `${window.location.origin}${pdfUrl}`
        : pdfUrl;

    if (error) {
        return (
            <Box sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1300,
                bgcolor: 'rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Box sx={{
                    position: 'relative',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 6,
                    p: 4,
                    maxWidth: 900,
                    width: '95vw',
                    maxHeight: '95vh',
                    overflow: 'auto',
                }}>
                    {onClose && (
                        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                            <CloseIcon />
                        </IconButton>
                    )}
                    <Typography color="error" variant="h6">
                        {error}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={handleRetry}
                    >
                        Retry Loading
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            bgcolor: 'rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Box sx={{
                position: 'relative',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 6,
                p: 0,
                maxWidth: 900,
                width: '95vw',
                maxHeight: '95vh',
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
            }}>
                {onClose && (
                    <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'grey.100' } }}>
                        <CloseIcon />
                    </IconButton>
                )}
                <Box sx={{
                    p: 2,
                    pb: 0,
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {title ? `Reading: ${title}` : 'Reading'}
                    </Typography>
                </Box>
                <Box sx={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    minHeight: 300,
                }}>
                    {loading && (
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: 'rgba(255,255,255,0.7)',
                            zIndex: 1,
                        }}>
                            <CircularProgress />
                        </Box>
                    )}
                    <iframe
                        src={`${formattedUrl}#toolbar=0`}
                        style={{
                            width: '100%',
                            height: '80vh',
                            minHeight: 300,
                            border: 'none',
                            background: '#fff',
                        }}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        title="PDF Viewer"
                        allowFullScreen
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default BasicPDFViewer; 