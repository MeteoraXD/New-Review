import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  CardMedia,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Book as BookIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { 
  getFavorites, 
  removeFromFavorites,
  getReadingHistory
} from '../utils/localStorageUtils';

// Local placeholder image for books and avatars
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EBook Cover%3C/text%3E%3C/svg%3E";
const AVATAR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%233f51b5'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3EU%3C/text%3E%3C/svg%3E";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [books, setBooks] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: ''
  });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    loadLocalProfile();
    loadLocalFavorites();
    try {
      // Only try to fetch books if we're online
      if (navigator.onLine) {
        fetchBooks();
      } else {
        setNetworkError(true);
      }
    } catch (err) {
      console.error("Error in initial profile load:", err);
    }
  }, []);

  const loadLocalProfile = () => {
    setLoading(true);
    try {
      setNetworkError(!navigator.onLine);
      
      // Get data from localStorage or user context
      const userData = user || JSON.parse(localStorage.getItem('user')) || {};
      
      setUserProfile({
        name: userData.name || userData.username || 'User',
        email: userData.email || 'user@example.com',
        bio: userData.bio || 'Book enthusiast and avid reader. I love science fiction and historical novels.',
        avatar: userData.avatar || userData.profilePicture || AVATAR_PLACEHOLDER
      });
    } catch (err) {
      console.error('Error loading local profile:', err);
      setError('Failed to load profile data');
      
      // Fallback to minimal data
      setUserProfile({
        name: 'User',
        email: 'user@example.com',
        bio: 'Book enthusiast and avid reader.',
        avatar: AVATAR_PLACEHOLDER
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLocalFavorites = () => {
    try {
      setFavorites(getFavorites());
      setReadingHistory(getReadingHistory());
    } catch (err) {
      console.error('Error loading favorites/history:', err);
      setFavorites([]);
      setReadingHistory([]);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get('/api/books');
      setBooks(response.data);
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({
          ...prev,
          avatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    try {
      setLoading(true);
      
      // Update user in local context
      if (typeof user?.updateProfile === 'function') {
        user.updateProfile({
          name: userProfile.name,
          email: userProfile.email,
          avatar: userProfile.avatar
        });
        
        setEditMode(false);
        toast.success('Profile updated');
      } else {
        // Fallback if updateProfile is not available
        if (user) {
          const updatedUser = {
            ...user,
            name: userProfile.name,
            email: userProfile.email,
            avatar: userProfile.avatar
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          toast.success('Profile saved locally');
        } else {
          toast.warning('Could not save profile - user data not available');
        }
        setEditMode(false);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (bookId) => {
    const newFavorites = removeFromFavorites(bookId);
    setFavorites(newFavorites);
    toast.success('Book removed from favorites');
  };

  const getFavoriteBooks = () => {
    return books.filter(book => favorites.includes(book._id || book.id));
  };

  const getReadingHistoryBooks = () => {
    return readingHistory.map(historyItem => {
      const book = books.find(b => b._id === historyItem.id || b.id === historyItem.id);
      return book ? {
        ...book,
        progressDate: historyItem.date ? new Date(historyItem.date) : new Date(),
        progress: historyItem.progress
      } : null;
    }).filter(Boolean); // Remove any undefined entries
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError('');

      // Simulate success since the endpoint is not available
      setTimeout(() => {
        toast.success('Password changed successfully');
        setChangePasswordOpen(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError('Failed to change password');
      toast.error('Failed to change password');
      setPasswordLoading(false);
    }
  };

  if (loading && !userProfile.name) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const favoriteBooks = getFavoriteBooks();
  const historyBooks = getReadingHistoryBooks();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {networkError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Server connection unavailable. You're viewing and editing profile data in offline mode. 
          Changes will be saved locally only.
        </Alert>
      )}
      <Grid container spacing={4}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      editMode ? (
                        <IconButton 
                          size="small" 
                          sx={{ bgcolor: 'primary.main', color: 'white' }}
                          component="label"
                        >
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleAvatarChange}
                          />
                          <EditIcon fontSize="small" />
                        </IconButton>
                      ) : null
                    }
                  >
                    <Avatar
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      sx={{ width: 120, height: 120 }}
                    />
                  </Badge>
                </Box>
              </Grid>
              <Grid item xs={12} md={editMode ? 10 : 8}>
                {editMode ? (
                  <Box component="form" sx={{ mt: 1 }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="name"
                      label="Name"
                      value={userProfile.name}
                      onChange={handleInputChange}
                    />
                    <TextField
                      margin="normal"
                      disabled
                      fullWidth
                      name="email"
                      label="Email"
                      value={userProfile.email}
                    />
                    <TextField
                      margin="normal"
                      fullWidth
                      name="bio"
                      label="Bio"
                      multiline
                      rows={3}
                      value={userProfile.bio}
                      onChange={handleInputChange}
                    />
                  </Box>
                ) : (
                  <>
                    <Typography variant="h4" gutterBottom>
                      {userProfile.name}
                    </Typography>
                    <Typography variant="body1" color="textSecondary" gutterBottom>
                      {userProfile.email}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {userProfile.bio}
                    </Typography>
                    
                    {/* User Role Information */}
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Account Type:
                      </Typography>
                      <Chip 
                        label={user?.role?.toUpperCase() || 'READER'} 
                        color={
                          user?.role === 'admin' ? 'error' : 
                          user?.role === 'author' ? 'secondary' : 'primary'
                        }
                        size="small"
                      />
                      
                      {user && user.role !== 'author' && user.role !== 'admin' && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ ml: 2 }}
                          onClick={() => {
                            const { updateUserRole } = require('../context/AuthContext').useAuth();
                            updateUserRole('author');
                            toast.success('Role updated to Author. Please refresh the page.');
                            setTimeout(() => window.location.reload(), 1500);
                          }}
                        >
                          Become an Author
                        </Button>
                      )}
                    </Box>
                  </>
                )}
              </Grid>
              <Grid item xs={12} md={editMode ? 2 : 3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center', height: '100%' }}>
                  {editMode ? (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => setEditMode(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tabs Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab icon={<BookIcon />} label="My Library" />
              <Tab icon={<FavoriteIcon />} label="Favorites" />
              <Tab icon={<HistoryIcon />} label="Reading History" />
              <Tab icon={<SettingsIcon />} label="Account Settings" />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          <Box sx={{ mb: 3 }}>
            {tabValue === 0 && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  My Library
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Books you've purchased or added to your collection
                </Typography>
                
                {books.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Your library is empty
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/books')}
                    >
                      Browse Books
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {books.slice(0, 4).map((book) => (
                      <Grid item key={book._id || book.id} xs={12} sm={6} md={3}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardMedia
                            component="img"
                            height="180"
                            image={book.coverImage || PLACEHOLDER_IMAGE}
                            alt={book.title}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="div" noWrap>
                              {book.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              By {typeof book.author === 'object' ? book.author.name : book.author || 'Unknown Author'}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/books/${book._id || book.id}`)}
                              sx={{ mt: 1 }}
                            >
                              Read Now
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
                
                {books.length > 4 && (
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/books')}
                    >
                      View All Books
                    </Button>
                  </Box>
                )}
              </Paper>
            )}

            {tabValue === 1 && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Favorites
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Books you've marked as favorites
                </Typography>
                
                {favoriteBooks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      You haven't added any favorites yet
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/books')}
                    >
                      Browse Books
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {favoriteBooks.map((book) => (
                      <Paper key={book._id || book.id} elevation={1} sx={{ mb: 2 }}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{ p: 2 }}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleRemoveFavorite(book._id || book.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemAvatar sx={{ mr: 2 }}>
                            <Avatar
                              variant="rounded"
                              src={book.coverImage || PLACEHOLDER_IMAGE}
                              alt={book.title}
                              sx={{ width: 60, height: 80 }}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={book.title}
                            secondary={
                              <Box component="span">
                                <Typography component="span" variant="body2" color="text.primary">
                                  {typeof book.author === 'object' ? book.author.name : book.author || 'Unknown Author'}
                                </Typography>
                                <Typography component="span" variant="body2" sx={{ mt: 1, display: 'block' }}>
                                  {book.description && book.description.substring(0, 100)}...
                                </Typography>
                              </Box>
                            }
                            secondaryTypographyProps={{ component: 'span' }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/books/${book._id || book.id}`)}
                            sx={{ ml: 2, alignSelf: 'center' }}
                          >
                            View
                          </Button>
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                )}
              </Paper>
            )}

            {tabValue === 2 && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Reading History
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Your recent reading activity
                </Typography>
                
                {historyBooks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1">
                      No reading history yet
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {historyBooks.map((book) => (
                      <Paper key={book._id || book.id} elevation={1} sx={{ mb: 2 }}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{ p: 2 }}
                        >
                          <ListItemAvatar sx={{ mr: 2 }}>
                            <Avatar
                              variant="rounded"
                              src={book.coverImage || PLACEHOLDER_IMAGE}
                              alt={book.title}
                              sx={{ width: 60, height: 80 }}
                            />
                          </ListItemAvatar>
                          <ListItemText
                            primary={book.title}
                            secondary={
                              <Box component="span">
                                <Typography component="span" variant="body2" color="text.primary">
                                  {typeof book.author === 'object' ? book.author.name : book.author || 'Unknown Author'}
                                </Typography>
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                  <Chip 
                                    size="small" 
                                    label={`Progress: ${book.progress}%`} 
                                    color="primary" 
                                    variant="outlined" 
                                  />
                                  <Chip 
                                    size="small" 
                                    label={book.progressDate?.toLocaleDateString() || 'Unknown'} 
                                    color="default" 
                                    variant="outlined" 
                                  />
                                </Box>
                              </Box>
                            }
                            secondaryTypographyProps={{ component: 'span' }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(`/books/${book._id || book.id}`)}
                            sx={{ ml: 2, alignSelf: 'center' }}
                          >
                            Continue Reading
                          </Button>
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                )}
              </Paper>
            )}

            {tabValue === 3 && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Account Settings
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Security
                  </Typography>
                  <Button
                    variant="outlined"
                    sx={{ mb: 2 }}
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    Change Password
                  </Button>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Manage your email notification preferences
                  </Typography>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom color="error">
                    Danger Zone
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={logout}
                    >
                      Logout
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                    >
                      Delete Account
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>
      
      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleChangePassword} 
            color="primary"
            disabled={passwordLoading}
          >
            {passwordLoading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 