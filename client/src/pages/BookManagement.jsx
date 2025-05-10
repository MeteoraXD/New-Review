import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const BookManagement = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        coverImage: ''
    });

    const categories = [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Poetry',
        'Other'
    ];

    const fetchBooks = useCallback(async () => {
        try {
            const response = await fetch('/api/books');
            if (!response.ok) {
                throw new Error('Failed to fetch books');
            }
            const data = await response.json();
            // Filter books to show only the author's books
            setBooks(data.filter(book => book.author._id === user._id));
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [user._id]);

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    const handleOpenDialog = () => {
        setFormData({
            title: '',
            description: '',
            category: '',
            coverImage: ''
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...formData
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save book');
            }

            toast.success('Book added successfully!');
            handleCloseDialog();
            fetchBooks();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (bookId) => {
        if (!window.confirm('Are you sure you want to delete this book?')) {
            return;
        }

        try {
            const response = await fetch(`/api/books/${bookId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete book');
            }

            toast.success('Book deleted successfully!');
            fetchBooks();
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    Manage Books
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenDialog}
                >
                    Add New Book
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={4}>
                {books.map((book) => (
                    <Grid item key={book._id} xs={12} sm={6} md={4}>
                        <Card>
                            <CardMedia
                                component="img"
                                height="200"
                                image={book.coverImage}
                                alt={book.title}
                            />
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="h2">
                                    {book.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {book.category}
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleDelete(book._id)}
                                >
                                    Delete
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Add New Book
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            multiline
                            rows={4}
                            required
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            select
                            label="Category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                        >
                            {categories.map((category) => (
                                <MenuItem key={category} value={category}>
                                    {category}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            label="Cover Image URL"
                            name="coverImage"
                            value={formData.coverImage}
                            onChange={handleChange}
                            required
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">
                            Add
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
};

export default BookManagement; 