import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemAvatar,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Divider,
  Chip,
  LinearProgress,
  Container,
  Avatar,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Book as BookIcon, 
  LibraryBooks as LibraryIcon, 
  RateReview as ReviewIcon,
  MenuBook as ReadingIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Star as StarIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import axios from '../utils/axios';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    user: {
      isPremium: false,
      premiumExpiry: null,
      daysRemaining: 0
    },
    stats: {
      totalFavorites: 0,
      totalReadingHistory: 0
    },
    recent: {
      readingHistory: [],
      favorites: []
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Fetching dashboard data...');
        const response = await axios.get('/api/users/dashboard');
        console.log('Dashboard data received:', response.data);
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Welcome, {user?.username || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Here's your reading dashboard
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Premium Status Card - Only show for premium users */}
        {stats.user.isPremium && (
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                bgcolor: 'primary.light'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LockIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Premium Member
                </Typography>
              </Box>
              <Typography variant="body1" gutterBottom>
                Your premium subscription expires in {stats.user.daysRemaining} days
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/premium')}
                sx={{ mt: 2 }}
              >
                Manage Subscription
              </Button>
            </Paper>
          </Grid>
        )}

        {/* Reading Stats Card */}
        <Grid item xs={12} md={stats.user.isPremium ? 4 : 6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              height: '100%',
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Reading Statistics
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <BookIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Books Read" 
                  secondary={stats.stats.totalReadingHistory}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <FavoriteIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Favorite Books" 
                  secondary={stats.stats.totalFavorites}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions Card */}
        <Grid item xs={12} md={stats.user.isPremium ? 4 : 6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              height: '100%',
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Quick Actions
            </Typography>
            <List>
              <ListItem button onClick={() => navigate('/books')}>
                <ListItemIcon>
                  <LibraryIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Browse Books" />
              </ListItem>
              <ListItem button onClick={() => navigate('/reading-list')}>
                <ListItemIcon>
                  <ReadingIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="My Reading List" />
              </ListItem>
              <ListItem button onClick={() => navigate('/reviews')}>
                <ListItemIcon>
                  <ReviewIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="My Reviews" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Recently Read Books */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              height: '100%',
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Recently Read
            </Typography>
            {stats.recent.readingHistory.length > 0 ? (
              <List>
                {stats.recent.readingHistory.map((item, index) => (
                  <ListItem key={index} divider={index < stats.recent.readingHistory.length - 1}>
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={item.book.coverImage}
                        alt={item.book.title}
                        sx={{ width: 60, height: 80 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.book.title}
                      secondary={
                        <Box component="span">
                          <Typography component="span" variant="body2" color="text.primary">
                            {item.book.author}
                          </Typography>
                          <Box component="span" sx={{ display: 'block', mt: 1 }}>
                            <Chip 
                              size="small" 
                              label={`Page ${item.lastReadPage}`} 
                              color="primary" 
                              variant="outlined" 
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No recent reading history
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Favorite Books */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              height: '100%',
              borderRadius: 2,
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Favorite Books
            </Typography>
            {stats.recent.favorites.length > 0 ? (
              <List>
                {stats.recent.favorites.map((book, index) => (
                  <ListItem key={index} divider={index < stats.recent.favorites.length - 1}>
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={book.coverImage}
                        alt={book.title}
                        sx={{ width: 60, height: 80 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={book.title}
                      secondary={
                        <Box component="span">
                          <Typography component="span" variant="body2" color="text.primary">
                            {book.author}
                          </Typography>
                          <Box component="span" sx={{ display: 'block', mt: 1 }}>
                            <Chip 
                              size="small" 
                              label={book.category} 
                              color="secondary" 
                              variant="outlined" 
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No favorite books yet
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 