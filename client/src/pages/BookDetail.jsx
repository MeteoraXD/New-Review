import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    Typography,
    Button,
    Box,
    Rating,
    TextField,
    Divider,
    Alert,
    CircularProgress,
    Paper,
    IconButton,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { toggleFavorite, isFavorite, addToReadingHistory } from '../utils/localStorageUtils';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { Book as BookIcon } from '@mui/icons-material';
import { PLACEHOLDER_IMAGE, ERROR_IMAGE, handleImageError } from '../utils/imageUtils';
import BookCover from '../components/BookCover';
import BasicPDFViewer from '../components/BasicPDFViewer';
import { formatPdfUrl } from '../utils/pdfUtils';
import { MenuBook as MenuBookIcon, Lock as LockIcon } from '@mui/icons-material';
import { AlertTitle } from '@mui/material';
import { RateReview as RateReviewIcon } from '@mui/icons-material';
import { Send as SendIcon } from '@mui/icons-material';
import PDFUploader from '../components/PDFUploader';
import ErrorBoundary from '../components/ErrorBoundary';
import { Close as CloseIcon } from '@mui/icons-material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

    const BookDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPremiumAccess } = useAuth();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [review, setReview] = useState({
        rating: 0,
        comment: ''
    });
    const [favorite, setFavorite] = useState(false);
    const [showPdfReader, setShowPdfReader] = useState(false);
    const [readings, setReadings] = useState([]);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [reviewsError, setReviewsError] = useState('');
    const [averageRating, setAverageRating] = useState(0);

    const ensureValidPdfUrl = (url) => {
        if (!url) {
            throw new Error('No PDF URL provided');
        }

        try {
            // If it's a relative path, make it absolute
            if (url.startsWith('/')) {
                url = `${window.location.origin}${url}`;
            }

            // Validate URL format
            const urlObj = new URL(url);
            if (!urlObj.protocol.startsWith('http')) {
                throw new Error('Invalid URL protocol');
            }

            // Ensure the URL points to a PDF file
            if (!url.toLowerCase().endsWith('.pdf')) {
                throw new Error('URL must point to a PDF file');
            }

            return url;
        } catch (error) {
            console.error('PDF URL validation error:', error);
            throw new Error(`Invalid PDF URL: ${error.message}`);
        }
    };

    const fetchBook = useCallback(async () => {
        if (!id) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            console.log('Token being sent:', token);
            const response = await axios.get(`/api/books/${id}`, {
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            });
            
            if (response.data && response.data.success) {
                setBook(response.data.data);
                // Only set error for actual errors, not for premium access messages
                if (response.data.message && !response.data.message.includes('premium')) {
                    setError(response.data.message);
                }
            } else {
                setError(response.data?.message || 'Error fetching book');
            }
        } catch (err) {
            console.error('Error fetching book:', err);
            setError(err.response?.data?.message || 'Error fetching book');
        } finally {
            setLoading(false);
        }
    }, [id, user, hasPremiumAccess]);

    useEffect(() => {
        // If no ID is provided, don't try to fetch a book
        if (!id) {
            setLoading(false);
            return;
        }

        fetchBook();
    }, [id, fetchBook]);

    useEffect(() => {
        // Check if book is in favorites
        if (book && book._id) {
            setFavorite(isFavorite(book._id));
        }
    }, [book]);

    useEffect(() => {
        if (book) {
            console.log('Book data loaded:', book);
            console.log('PDF URL:', book.pdfUrl);
            console.log('Is PDF URL valid?', !!book.pdfUrl);
        }
    }, [book]);

    // Fetch reviews for the book
    const fetchReviews = useCallback(async () => {
        setReviewsLoading(true);
        setReviewsError('');
        try {
            const { data } = await axios.get(`/api/reviews/book/${id}`);
            if (data.success) {
                setReviews(data.data.reviews);
                setAverageRating(data.data.averageRating || 0);
            } else {
                setReviewsError(data.message || 'Failed to load reviews');
            }
        } catch (err) {
            setReviewsError(err.response?.data?.message || 'Failed to load reviews');
        } finally {
            setReviewsLoading(false);
        }
    }, [id]);

    // Fetch reviews when book loads
    useEffect(() => {
        if (id) fetchReviews();
    }, [id, fetchReviews]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please log in to submit a review');
            navigate('/login');
            return;
        }
        if (!review.rating) {
            toast.error('Please select a rating');
            return;
        }
        if (!review.comment.trim()) {
            toast.error('Please write a comment');
            return;
        }
        setSubmittingReview(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                '/api/reviews',
                { bookId: id, rating: review.rating, comment: review.comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                toast.success('Review submitted successfully!');
                setReview({ rating: 0, comment: '' });
                fetchReviews();
            } else {
                toast.error(response.data.message || 'Failed to submit review');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!user) {
            toast.info('Please log in to add favorites');
            return;
        }
        
        setFavoriteLoading(true);
        
        try {
            await toggleFavorite(book._id);
            setFavorite(!favorite);
            
            // Show success message
            toast.success(favorite ? 'Removed from favorites' : 'Added to favorites');
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('Failed to update favorites');
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleStartReading = () => {
        if (!user) {
            toast.info('Please log in to track your reading');
            return;
        }

        // Add to reading history with initial progress
        addToReadingHistory(book._id, 0);
        toast.success('Book added to your reading list');
        handleReadNow();
    };

    const handleContinueReading = () => {
        if (!user) {
            toast.info('Please log in to track your reading');
            return;
        }

        // Add to reading history with continued progress
        addToReadingHistory(book._id, 50);
        toast.success('Continuing where you left off');
        // In a real app, this would navigate to a reading view at the saved position
        handleReadNow();
    };

    const handleUpgrade = () => {
        navigate('/premium');
    };

    const handleReadNow = async () => {
        try {
            if (!book.pdfUrl) {
                toast.error('PDF not available for this book');
                return;
            }

            // Check premium access
            if (book.isPremium && !book.canAccessPdf) {
                setShowUpgradeModal(true);
                return;
            }

            // Validate and format the PDF URL
            let validPdfUrl = book.pdfUrl;
            if (validPdfUrl.startsWith('/')) {
                validPdfUrl = `${window.location.origin}${validPdfUrl}`;
            }

            console.log('Attempting to load PDF from URL:', validPdfUrl);

            // Check if PDF is accessible
            try {
                const response = await fetch(validPdfUrl, { method: 'HEAD' });
                if (!response.ok) {
                    throw new Error(`PDF not accessible: ${response.status}`);
                }
            } catch (error) {
                console.error('PDF accessibility check failed:', error);
                toast.error('Unable to access the PDF file. Please try again later.');
                return;
            }

            setSelectedPdfUrl(validPdfUrl);
            setPdfViewerOpen(true);

            // Add to reading history if user is logged in
            if (user) {
                addToReadingHistory(book._id, 0);
            }
        } catch (error) {
            console.error('Error opening PDF:', error);
            toast.error(error.message || 'Error opening PDF');
        }
    };

    const PDFReaderDialog = ({ open, onClose, pdfUrl }) => {
        const [error, setError] = useState(null);

        const handleError = (error) => {
            console.error('PDF Viewer error:', error);
            setError(error);
            toast.error('Error loading PDF. Please try again later.');
        };

        return (
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="xl"
                fullWidth
                PaperProps={{
                    sx: {
                        height: '90vh',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
            >
                <DialogTitle>
                    <Box component="span" sx={{ typography: 'h6' }}>
                        Reading: {book?.title}
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ flex: 1, p: 0, display: 'flex', flexDirection: 'column' }}>
                    {error ? (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography color="error" gutterBottom>
                                {error.message || 'Error loading PDF'}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setError(null);
                                    handleReadNow();
                                }}
                                startIcon={<RefreshIcon />}
                            >
                                Retry
                            </Button>
                        </Box>
                    ) : (
                        <BasicPDFViewer
                            pdfUrl={pdfUrl}
                            onError={handleError}
                        />
                    )}
                </DialogContent>
            </Dialog>
        );
    };

    // Add the upgrade modal component
    const UpgradeModal = () => (
        <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)}>
            <DialogTitle>Upgrade to Premium</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    This book requires premium access. Upgrade your account to read premium content.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
                <Button onClick={handleUpgrade} color="primary" variant="contained">
                    Upgrade Now
                </Button>
            </DialogActions>
        </Dialog>
    );

    // In the render section, replace book.reviews with reviews, and use reviewsLoading/reviewsError
    // Only show the review form if the user hasn't already reviewed
    const userHasReviewed = user && reviews.some(r => r.user && (r.user._id === user.id || r.user._id === user._id));

    if (loading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    // If id is null/undefined (not a detail view) or we're in add mode, don't show error
    if (!id) {
        return null;
    }

    if (error && !error.includes('premium')) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/books')}
                >
                    Back to Books
                </Button>
            </Container>
        );
    }

    if (!book) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="info">Book not found or you're not authorized to view it.</Alert>
                <Box mt={2} textAlign="center">
                    <Button variant="contained" onClick={() => navigate('/books')}>
                        Back to Books
                    </Button>
                </Box>
            </Container>
        );
    }

    // Debug information
    console.log('Rendering book details with: ', {
        title: book.title,
        hasPdfUrl: !!book.pdfUrl,
        pdfUrl: book.pdfUrl,
        isPremium: book.isPremium,
        userRole: user?.role,
        userMembership: user?.membership,
        hasPremiumAccess: user ? hasPremiumAccess?.() : false
    });

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <BookCover
                                imageUrl={book.coverImage}
                                title={book.title}
                                author={typeof book.author === 'object' ? book.author.name : book.author}
                                height={450}
                            />
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h4" gutterBottom>{book.title}</Typography>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            by {typeof book.author === 'object' ? book.author.name : book.author || 'Unknown Author'}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ mb: 2 }}>
                            <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    bgcolor: book.isPremium ? 'secondary.main' : 'success.main',
                                    color: 'white',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 2,
                                    fontWeight: 'bold'
                                }}
                            >
                                {book.isPremium ? '⭐ Premium' : '✓ Free'}
                            </Typography>
                        </Box>
                        
                        <Typography variant="body1" paragraph>
                            {book.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Category:</strong> {book.category}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Published:</strong> {book.publishedYear}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Pages:</strong> {book.pages}
                            </Typography>
                        </Box>
                        
                        {/* Book action buttons */}
                        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                            {book.pdfUrl && (
                                <>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleReadNow}
                                        disabled={!book.pdfUrl}
                                        startIcon={<MenuBookIcon />}
                                    >
                                        {book.isPremium && !book.canAccessPdf ? 'Upgrade to Read' : 'Read Now'}
                                    </Button>
                                    
                                    {book.isPremium && !book.canAccessPdf && (
                                        <Box sx={{ 
                                            mt: 2, 
                                            p: 2, 
                                            bgcolor: 'rgba(220, 0, 78, 0.1)', 
                                            borderRadius: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            width: '100%'
                                        }}>
                                            <LockIcon color="secondary" />
                                            <Typography variant="body2" color="secondary">
                                                {!user ? 'Please log in to access this premium book' : 'Upgrade to premium to read this book'}
                                            </Typography>
                                        </Box>
                                    )}
                                </>
                            )}
                            
                            {!book.pdfUrl && (
                                <Typography variant="body2" color="text.secondary">
                                    No PDF available for this book.
                                </Typography>
                            )}
                        </Box>
                        
                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            <Button 
                                variant="outlined"
                                onClick={() => navigate('/books')}
                            >
                                Back to Books
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Divider sx={{ my: 4 }} />

            {/* PDF Uploader for authenticated users */}
            {user && (
                <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                        PDF Management
                    </Typography>
                    
                    <PDFUploader 
                        bookId={book._id} 
                        onPdfUploaded={(newPdfUrl) => {
                            // Update the book object with the new PDF URL
                            setBook({
                                ...book,
                                pdfUrl: newPdfUrl
                            });
                            toast.success('PDF updated successfully! You can now read the book.');
                        }} 
                    />
                </Paper>
            )}

            <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <RateReviewIcon sx={{ mr: 1 }} /> Reviews
                </Typography>
                {averageRating > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Rating value={averageRating} precision={0.1} readOnly />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1, display: 'inline' }}>
                            {averageRating.toFixed(1)} average rating
                        </Typography>
                    </Box>
                )}
                {user && !userHasReviewed ? (
                    <Box component="form" onSubmit={handleReviewSubmit} sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                            Write a Review
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body1" sx={{ mr: 2 }}>
                                Your Rating:
                            </Typography>
                            <Rating
                                value={review.rating}
                                onChange={(event, newValue) => {
                                    setReview({ ...review, rating: newValue });
                                }}
                                size="large"
                                precision={0.5}
                            />
                            {review.rating === 0 && (
                                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                                    Please select a rating
                                </Typography>
                            )}
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={review.comment}
                            onChange={(e) => setReview({ ...review, comment: e.target.value })}
                            placeholder="Share your thoughts about this book..."
                            sx={{ mt: 2 }}
                            error={review.comment.trim() === '' && review.rating > 0}
                            helperText={review.comment.trim() === '' && review.rating > 0 ? "Please write your review" : ""}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ mt: 2 }}
                            disabled={submittingReview || !review.rating || !review.comment.trim()}
                            startIcon={submittingReview ? <CircularProgress size={20} /> : <SendIcon />}
                        >
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </Box>
                ) : user && userHasReviewed ? (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <AlertTitle>Thank you for your review!</AlertTitle>
                        You have already reviewed this book.
                    </Alert>
                ) : (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <AlertTitle>Want to leave a review?</AlertTitle>
                        Please <RouterLink to="/login">log in</RouterLink> to share your thoughts about this book.
                    </Alert>
                )}
                <Divider sx={{ mb: 3 }} />
                {reviewsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : reviewsError ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography color="error">{reviewsError}</Typography>
                    </Box>
                ) : reviews.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                            No reviews yet. Be the first to review this book!
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                            {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                        </Typography>
                        {reviews.map((review, index) => (
                            <Box 
                                key={index} 
                                sx={{ 
                                    mb: 3, 
                                    p: 2, 
                                    borderRadius: 1, 
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                        {review.user?.username ? review.user.username[0].toUpperCase() : 'U'}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2">
                                            {review.user?.username || 'Anonymous'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(review.date).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Rating value={review.rating} readOnly precision={0.5} />
                                <Typography variant="body1" component="div" sx={{ mt: 1 }}>
                                    {review.comment}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {/* Add favorite button */}
            <IconButton
                onClick={handleToggleFavorite}
                color={favorite ? "error" : "default"}
                sx={{ position: 'absolute', top: 10, right: 10 }}
            >
                {favorite ? <Favorite /> : <FavoriteBorder />}
            </IconButton>

            {/* Add the upgrade modal */}
            <UpgradeModal />

            {/* Add PDF Reader Dialog */}
            <PDFReaderDialog
                open={pdfViewerOpen}
                onClose={() => setPdfViewerOpen(false)}
                pdfUrl={selectedPdfUrl}
            />
        </Container>
    );
};

export default BookDetail; 