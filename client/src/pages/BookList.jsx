 import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    TextField,
    Box,
    MenuItem,
    CircularProgress,
    Alert,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    Chip,
    Rating,
    IconButton,
    InputAdornment,
    Divider,
    Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import axios from '../utils/axios';
import { PLACEHOLDER_IMAGE, handleImageError } from '../utils/imageUtils';
import BookCover from '../components/BookCover';
import { useAuth } from '../context/AuthContext';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import { Link as RouterLink } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

const BookList = ({ premiumOnly, freeOnly }) => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('title');
    const [sortOrder, setSortOrder] = useState('asc');
    const [page, setPage] = useState(1);
    const [favorites, setFavorites] = useState([]);
    const booksPerPage = 12;
    const { user, hasPremiumAccess } = useAuth();

    // Determine the page title based on props
    const getPageTitle = () => {
        if (premiumOnly) return "Premium Books";
        if (freeOnly) return "Free Books";
        return "Browse Books";
    };

    const categories = [
        'All',
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Poetry',
        'Other'
    ];

    const sortOptions = [
        { value: 'title-asc', label: 'Title (A-Z)' },
        { value: 'title-desc', label: 'Title (Z-A)' },
        { value: 'publishedYear-desc', label: 'Newest First' },
        { value: 'publishedYear-asc', label: 'Oldest First' }
    ];

    useEffect(() => {
        fetchBooks();
        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    const fetchBooks = async () => {
        setLoading(true);
        setError(null);
        
        console.log('Fetching books...');
        
        try {
            let url = '/api/books';
            
            // Add filter parameters based on premiumOnly or freeOnly
            const params = new URLSearchParams();
            if (premiumOnly) {
                params.append('isPremium', 'true');
                console.log('Fetching premium books only');
            } else if (freeOnly) {
                params.append('isPremium', 'false');
                console.log('Fetching free books only');
            }
            
            // Add the parameters to the URL if we have any
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            console.log('Making API request to:', url);
            
            // Try the request with a 10 second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await axios.get(url, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.data) {
                    console.log(`Received ${response.data.length} books from API`);
                    setBooks(response.data);
                } else {
                    console.warn('Response contained no data');
                    setBooks([]);
                }
            } catch (timeoutError) {
                console.error('Request timed out or was aborted:', timeoutError);
                
                // Try the fallback URL with http://localhost:5000 explicitly
                console.log('Trying fallback direct URL request...');
                const fallbackResponse = await axios.get(`http://localhost:5000${url}`);
                
                if (fallbackResponse.data) {
                    console.log(`Received ${fallbackResponse.data.length} books from fallback API`);
                    setBooks(fallbackResponse.data);
                } else {
                    throw new Error('Fallback request returned no data');
                }
            }
        } catch (err) {
            console.error('Error fetching books:', err);
            
            // Check if we have connection issues
            if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
                setError('Network error: The server appears to be offline or unreachable. Please check your internet connection and try again.');
            } else if (err.response) {
                // Server responded with error status
                setError(`Server error: ${err.response.data?.message || err.response.statusText || 'Unknown error'}`);
            } else {
                setError('Failed to load books. Please try again later.');
            }
            
            // Set empty books array to prevent issues with undefined
            setBooks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSortChange = (event) => {
        const value = event.target.value;
        const [field, order] = value.split('-');
        setSortBy(field);
        setSortOrder(order);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddBook = () => {
        navigate('/admin/books/add');
    };

    const toggleFavorite = (bookId) => {
        let newFavorites;
        if (favorites.includes(bookId)) {
            newFavorites = favorites.filter(id => id !== bookId);
        } else {
            newFavorites = [...favorites, bookId];
        }
        setFavorites(newFavorites);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        toast.success('Favorites updated!');
    };

    // Function to check if user has access to premium content
    const canAccessPremium = () => {
        if (!user) return false;
        return user.role === 'admin' || user.role === 'author' || hasPremiumAccess();
    };

    // Immediate redirect for premium books when user doesn't have access
    useEffect(() => {
        // Only redirect if user data is fully loaded (not null/undefined)
        if (premiumOnly && user) {
            const hasAccess = user.role === 'admin' || user.role === 'author' || hasPremiumAccess();
            if (!hasAccess) {
                console.log('User without premium access trying to view premium books. Redirecting to premium page.');
                console.log('User:', user);
                console.log('Role:', user.role);
                console.log('Has premium:', hasPremiumAccess());
                // Force redirect to premium page
                navigate('/premium');
            }
        }
    }, [premiumOnly, user, hasPremiumAccess, navigate]);

    // Add debugging logs
    useEffect(() => {
        if (premiumOnly) {
            console.log('Premium Books Page Loaded');
            console.log('User:', user);
            console.log('User isPremium:', user?.isPremium);
            console.log('User role:', user?.role);
            console.log('Has premium access:', hasPremiumAccess());
            console.log('Can access premium:', canAccessPremium());
        }
    }, [user, premiumOnly]);

    // Modified filtering logic to be more lenient
    const sortedAndFilteredBooks = books
        .filter(book => {
            // Filter by premium/free status if applicable
            if (premiumOnly && !book.isPremium) return false;
            if (freeOnly && book.isPremium) return false;
            
            // Get author name as string regardless of whether it's an object or a string
            const authorName = typeof book.author === 'object' 
                ? book.author.name || ''
                : book.author || '';
                
            // If no search query or category filter, show all books
            if (!searchQuery.trim() && (!categoryFilter || categoryFilter === 'All')) {
                return true;
            }
            
            // Check if book matches search query
            const matchesSearch = !searchQuery.trim() || 
                                book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (book.description && typeof book.description === 'string' && 
                                 book.description.toLowerCase().includes(searchQuery.toLowerCase()));
            
            // Check if book matches category filter
            const matchesCategory = !categoryFilter || 
                                   categoryFilter === 'All' || 
                                   (typeof book.category === 'object' ? 
                                   book.category.name === categoryFilter : 
                                   book.category === categoryFilter);
            
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'title') {
                return sortOrder === 'asc' 
                    ? a.title?.localeCompare(b.title || '') 
                    : b.title?.localeCompare(a.title || '');
            } else if (sortBy === 'publishedYear') {
                return sortOrder === 'asc' 
                    ? (a.publishedYear || 0) - (b.publishedYear || 0) 
                    : (b.publishedYear || 0) - (a.publishedYear || 0);
            }
            return 0;
        });

    // Log the number of books after potentially being filtered
    console.log("Books after filtering:", sortedAndFilteredBooks.length);

    // Pagination
    const indexOfLastBook = page * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    const currentBooks = sortedAndFilteredBooks.slice(indexOfFirstBook, indexOfLastBook);
    console.log("Books on current page:", currentBooks.length);

    // Debug banner display conditions
    if (premiumOnly) {
        console.log("Banner conditions check:");
        console.log("- premiumOnly:", premiumOnly);
        console.log("- user exists:", !!user);
        console.log("- !canAccessPremium():", !canAccessPremium());
        console.log("- Should show premium banner:", premiumOnly && user && !canAccessPremium());
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                {getPageTitle()}
            </Typography>

            {premiumOnly && !user && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: '#f0f7ff', border: '1px solid #bbdefb' }}>
                    <Box display="flex" alignItems="center">
                        <StarIcon sx={{ color: '#ffc107', mr: 2 }} />
                        <Box flexGrow={1}>
                            <Typography variant="h6">Premium Access Required</Typography>
                            <Typography variant="body2">
                                Sign in to access our premium book collection with exclusive titles and features.
                            </Typography>
                        </Box>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            component={RouterLink} 
                            to="/login?message=Login to access premium books"
                            startIcon={<LockIcon />}
                        >
                            Login for Premium
                        </Button>
                    </Box>
                </Paper>
            )}

            {premiumOnly && user && !canAccessPremium() && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff8e1', border: '1px solid #ffe082' }}>
                    <Box display="flex" alignItems="center">
                        <StarIcon sx={{ color: '#ffc107', mr: 2 }} />
                        <Box flexGrow={1}>
                            <Typography variant="h6">Upgrade to Premium</Typography>
                            <Typography variant="body2">
                                You need premium access to view these books. Upgrade now to unlock all premium content.
                            </Typography>
                        </Box>
                        <Button 
                            variant="contained" 
                            color="warning" 
                            component={RouterLink} 
                            to="/premium"
                            startIcon={<StarIcon />}
                        >
                            Upgrade to Premium
                        </Button>
                    </Box>
                </Paper>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                            Available Books
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleAddBook}
                            startIcon={<AddIcon />}
                        >
                            Add New Book
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Debugging info - can be removed later */}
            <Alert severity="info" sx={{ mb: 3 }}>
                Total books: {books.length} | After filtering: {sortedAndFilteredBooks.length} | On this page: {currentBooks.length}
                <Button 
                    variant="contained" 
                    color="primary"
                    size="small"
                    sx={{ ml: 2 }}
                    onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('');
                        setSortBy('title');
                        setSortOrder('asc');
                    }}
                >
                    View All Books
                </Button>
            </Alert>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            label="Search books"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={categoryFilter}
                                label="Category"
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                {categories.map((category) => (
                                    <MenuItem key={category} value={category}>
                                        {category}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth>
                            <InputLabel><SortIcon fontSize="small" sx={{ mr: 1 }} /> Sort By</InputLabel>
                            <Select
                                value={`${sortBy}-${sortOrder}`}
                                label="Sort By"
                                onChange={handleSortChange}
                            >
                                {sortOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <Box mt={2}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {currentBooks.length} of {sortedAndFilteredBooks.length} books
                    </Typography>
                </Box>
            </Paper>

            {books.length === 0 && !loading && !error && (
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        No books found in the library
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        There are currently no books to display. Check back later or contact the administrator.
                    </Typography>
                </Paper>
            )}

            {sortedAndFilteredBooks.length === 0 && books.length > 0 ? (
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        No books found matching your criteria
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Try adjusting your search or filters to find what you're looking for.
                    </Typography>
                    <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('');
                            setSortBy('title');
                            setSortOrder('asc');
                        }}
                    >
                        Clear Filters
                    </Button>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {currentBooks.map((book, index) => {
                            console.log(`Rendering book ${index}:`, book);
                            return (
                                <Grid item key={book._id || book.id || index} xs={12} sm={6} md={4} lg={3}>
                                    <Card 
                                        sx={{ 
                                            height: '100%', 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            transition: 'transform 0.3s, box-shadow 0.3s',
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                            }
                                        }}
                                    >
                                        <Box sx={{ position: 'relative' }}>
                                            <BookCover
                                                imageUrl={book.coverImage}
                                                title={book.title}
                                                author={typeof book.author === 'object' ? book.author.name : book.author}
                                                height={250}
                                            />
                                            <IconButton 
                                                sx={{ 
                                                    position: 'absolute', 
                                                    top: 5, 
                                                    right: 5,
                                                    bgcolor: 'rgba(255,255,255,0.8)',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255,255,255,0.9)',
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(book._id || book.id);
                                                }}
                                            >
                                                {favorites.includes(book._id || book.id) ? 
                                                    <FavoriteIcon color="error" /> : 
                                                    <FavoriteBorderIcon />
                                                }
                                            </IconButton>
                                            {book.isPremium && (
                                                <Chip
                                                    icon={!canAccessPremium() ? <LockIcon fontSize="small" /> : null}
                                                    label="Premium"
                                                    color="secondary"
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: 10,
                                                        left: 10,
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography gutterBottom variant="h6" component="h2" sx={{ mb: 0.5 }}>
                                                {book.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                By {typeof book.author === 'object' ? book.author.name : book.author || 'Unknown Author'}
                                            </Typography>
                                            
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Rating 
                                                    value={typeof book.rating === 'number' ? book.rating : 0}
                                                    readOnly 
                                                    precision={0.5} 
                                                    size="small"
                                                />
                                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                    ({typeof book.reviews === 'object' && Array.isArray(book.reviews) ? book.reviews.length : 0})
                                                </Typography>
                                            </Box>
                                            
                                            <Box sx={{ mb: 1 }}>
                                                <Chip 
                                                    label={typeof book.category === 'object' ? book.category.name : book.category || 'Uncategorized'} 
                                                    size="small" 
                                                    sx={{ fontSize: '0.7rem' }}
                                                />
                                                {book.publishedYear && (
                                                    <Chip 
                                                        label={typeof book.publishedYear === 'number' ? book.publishedYear : book.publishedYear.toString()} 
                                                        size="small" 
                                                        sx={{ ml: 1, fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </Box>
                                            
                                            <Typography 
                                                variant="body2" 
                                                color="text.secondary" 
                                                sx={{ 
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    flexGrow: 1,
                                                    mb: 1
                                                }}
                                            >
                                                {typeof book.description === 'object' ? JSON.stringify(book.description) : book.description || 'No description available'}
                                            </Typography>
                                            
                                            <Box sx={{ mt: 'auto' }}>
                                                <Divider sx={{ my: 1 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography 
                                                        variant="subtitle1" 
                                                        sx={{ 
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            bgcolor: book.isPremium ? 'secondary.main' : 'success.main',
                                                            color: 'white',
                                                            px: 1.5,
                                                            py: 0.3,
                                                            borderRadius: 1.5,
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {book.isPremium ? (
                                                            <>
                                                                {!canAccessPremium() && <LockIcon fontSize="small" sx={{ mr: 0.5 }} />}
                                                                ⭐ Premium
                                                            </>
                                                        ) : '✓ Free'}
                                                    </Typography>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        onClick={() => {
                                                            if (book.isPremium && !canAccessPremium()) {
                                                                toast.info('Premium access required');
                                                                navigate('/premium');
                                                            } else {
                                                                navigate(`/books/${book._id || book.id}`);
                                                            }
                                                        }}
                                                    >
                                                        {book.isPremium && !canAccessPremium() ? 'Upgrade to View' : 'View Details'}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination 
                            count={Math.ceil(sortedAndFilteredBooks.length / booksPerPage)} 
                            page={page} 
                            onChange={handlePageChange} 
                            color="primary" 
                            size="large"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                </>
            )}
        </Container>
    );
};

export default BookList;
