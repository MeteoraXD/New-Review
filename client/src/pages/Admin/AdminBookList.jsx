import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  TablePagination,
  Avatar,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from '../../utils/axios';

const AdminBookList = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/books');
      setBooks(response.data);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to load books. ' + (err.response?.data?.message || err.message));
      toast.error('Error fetching books');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddBook = () => {
    navigate('/admin/books/add');
  };

  const handleEditBook = (id) => {
    navigate(`/admin/books/edit/${id}`);
  };

  const handleViewBook = (id) => {
    // Opens book in a new tab
    window.open(`/books/${id}`, '_blank');
  };

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBookToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    
    try {
      setDeleting(true);
      const response = await axios.delete(`/api/books/${bookToDelete._id}`);
      
      if (response.status === 200) {
        toast.success('Book deleted successfully!');
        fetchBooks(); // Refresh the book list
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           'Error deleting book. Please try again.';
      toast.error(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
      setBookToDelete(null);
      setDeleting(false);
    }
  };

  // Filter books based on search term
  const filteredBooks = books.filter((book) => {
    const searchString = searchTerm.toLowerCase();
    return (
      (book.title && book.title.toLowerCase().includes(searchString)) ||
      (book.author && typeof book.author === 'string' && book.author.toLowerCase().includes(searchString)) ||
      (book.category && book.category.toLowerCase().includes(searchString)) ||
      (book.publishedYear && book.publishedYear.toString().includes(searchString))
    );
  });

  // Paginate the filtered books
  const displayedBooks = filteredBooks
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Book Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddBook}
        >
          Add New Book
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search books by title, author, category..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Cover</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Pages</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedBooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {searchTerm ? 'No books match your search' : 'No books available'}
                  </TableCell>
                </TableRow>
              ) : (
                displayedBooks.map((book) => (
                  <TableRow key={book._id}>
                    <TableCell>
                      <Avatar
                        alt={book.title}
                        src={book.coverImage}
                        variant="rounded"
                        sx={{ width: 56, height: 56 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {book.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {typeof book.author === 'object' ? book.author.name : book.author}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={book.category} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText'
                        }} 
                      />
                    </TableCell>
                    <TableCell>{book.publishedYear}</TableCell>
                    <TableCell>{book.pages}</TableCell>
                    <TableCell>
                      <Chip 
                        label={book.isPremium ? 'Premium' : 'Free'} 
                        size="small"
                        color={book.isPremium ? 'secondary' : 'success'}
                        icon={book.isPremium ? <StarIcon /> : null}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="View Book">
                          <IconButton 
                            color="info" 
                            size="small"
                            onClick={() => handleViewBook(book._id)}
                            sx={{ mx: 0.5 }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Book">
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => handleEditBook(book._id)}
                            sx={{ mx: 0.5 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Book">
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleDeleteClick(book)}
                            sx={{ mx: 0.5 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredBooks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Book</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{bookToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminBookList; 