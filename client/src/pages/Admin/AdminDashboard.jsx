import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, Divider, Button, 
  Card, CardContent, CardHeader, Avatar, IconButton,
  Chip, CircularProgress, List, ListItem, ListItemAvatar,
  ListItemText, ListItemSecondary
} from '@mui/material';
import { 
  PersonAdd, Book, Category, Star, Visibility, 
  ArrowUpward, ArrowDownward, TrendingUp, AutoStories,
  MoreVert, Download, PeopleAlt, AttachMoney
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import { styled } from '@mui/material/styles';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title 
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title
);

// Styled components
const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10]
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: '100%',
    backgroundColor: theme.palette.primary.main
  }
}));

const IconBox = styled(Box)(({ theme, color = 'primary' }) => ({
  backgroundColor: theme.palette[color].light,
  borderRadius: '50%',
  width: 56,
  height: 56,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    color: theme.palette[color].main,
    fontSize: 30
  }
}));

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    activeUsers: 0,
    premiumUsers: 0,
    totalRevenue: 0,
    categories: [],
    recentUsers: [],
    recentBooks: [],
    userActivity: []
  });
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    // Ensure Chart.js is loaded
    try {
      // Simple check to make sure ChartJS is available
      if (ChartJS) {
        setChartReady(true);
      }
    } catch (err) {
      console.error("Error loading Chart.js:", err);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // In a real app, these would be API calls
        // const response = await axios.get('/api/admin/dashboard');
        // setStats(response.data);
        
        // Mock data for demonstration
        setStats({
          totalUsers: 245,
          totalBooks: 1876,
          activeUsers: 178,
          premiumUsers: 42,
          totalRevenue: 12500,
          categories: [
            { name: 'Fiction', count: 450 },
            { name: 'Non-Fiction', count: 320 },
            { name: 'Science Fiction', count: 250 },
            { name: 'Mystery', count: 220 },
            { name: 'Self-Help', count: 180 }
          ],
          userGrowth: [
            { month: 'Jan', users: 120 },
            { month: 'Feb', users: 150 },
            { month: 'Mar', users: 180 },
            { month: 'Apr', users: 210 },
            { month: 'May', users: 245 }
          ],
          recentUsers: [
            { id: '1', name: 'John Doe', email: 'john@example.com', role: 'reader', joinedAt: '2 days ago' },
            { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'author', joinedAt: '3 days ago' },
            { id: '3', name: 'Robert Johnson', email: 'robert@example.com', role: 'reader', joinedAt: '1 week ago' }
          ],
          recentBooks: [
            { id: '1', title: 'The Silent Echo', author: 'Sarah Miller', category: 'Mystery', addedAt: '1 day ago' },
            { id: '2', title: 'Beyond the Stars', author: 'Michael Chen', category: 'Science Fiction', addedAt: '3 days ago' },
            { id: '3', title: 'Mindful Living', author: 'Emma Watson', category: 'Self-Help', addedAt: '5 days ago' }
          ],
          userActivity: [
            { type: 'login', user: 'John Doe', time: '2 hours ago' },
            { type: 'book_read', user: 'Alice Johnson', book: 'The Silent Echo', time: '3 hours ago' },
            { type: 'review', user: 'Robert Williams', book: 'Beyond the Stars', time: '5 hours ago' },
            { type: 'favorite', user: 'Sarah Adams', book: 'Mindful Living', time: '1 day ago' }
          ]
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Data for pie chart
  const categoryData = {
    labels: stats.categories.map(cat => cat.name),
    datasets: [
      {
        label: 'Books by Category',
        data: stats.categories.map(cat => cat.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Data for bar chart
  const userGrowthData = {
    labels: stats.userGrowth?.map(item => item.month) || [],
    datasets: [
      {
        label: 'User Growth',
        data: stats.userGrowth?.map(item => item.users) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/admin/reports"
        >
          Generate Reports
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" color="textSecondary">
                  Total Users
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold">
                  {stats.totalUsers}
                </Typography>
              </Box>
              <IconBox>
                <PeopleAlt />
              </IconBox>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                icon={<ArrowUpward fontSize="small" />} 
                label="+12% this month" 
                color="success" 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" color="textSecondary">
                  Total Books
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold">
                  {stats.totalBooks}
                </Typography>
              </Box>
              <IconBox color="secondary">
                <AutoStories />
              </IconBox>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                icon={<ArrowUpward fontSize="small" />} 
                label="+8% this month" 
                color="success" 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" color="textSecondary">
                  Premium Users
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold">
                  {stats.premiumUsers}
                </Typography>
              </Box>
              <IconBox color="warning">
                <Star />
              </IconBox>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                icon={<TrendingUp fontSize="small" />} 
                label="+5% this month" 
                color="success" 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" color="textSecondary">
                  Total Revenue
                </Typography>
                <Typography variant="h4" component="div" fontWeight="bold">
                  ${stats.totalRevenue}
                </Typography>
              </Box>
              <IconBox color="info">
                <AttachMoney />
              </IconBox>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                icon={<ArrowUpward fontSize="small" />} 
                label="+15% this month" 
                color="success" 
                size="small" 
                variant="outlined" 
              />
            </Box>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              User Growth Trend
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              {chartReady && (
                <Bar 
                  data={userGrowthData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Books by Category
            </Typography>
            <Box sx={{ height: 300, mt: 2, display: 'flex', justifyContent: 'center' }}>
              {chartReady && (
                <Pie
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: false
                      }
                    }
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader 
              title="Recent Users" 
              action={
                <IconButton component={Link} to="/admin/users">
                  <MoreVert />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <List>
                {stats.recentUsers.map((user, index) => (
                  <ListItem key={user.id} divider={index < stats.recentUsers.length - 1}>
                    <ListItemAvatar>
                      <Avatar>{user.name.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={user.name} 
                      secondary={
                        <>
                          {user.email} • {user.joinedAt}
                          <br />
                          <Chip size="small" label={user.role} sx={{ mt: 0.5 }} />
                        </>
                      } 
                    />
                  </ListItem>
                ))}
              </List>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }} 
                component={Link} 
                to="/admin/users"
              >
                View All Users
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader 
              title="Recent Books" 
              action={
                <IconButton component={Link} to="/admin/books">
                  <MoreVert />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <List>
                {stats.recentBooks.map((book, index) => (
                  <ListItem key={book.id} divider={index < stats.recentBooks.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <Book />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={book.title} 
                      secondary={
                        <>
                          By {book.author} • {book.addedAt}
                          <br />
                          <Chip size="small" label={book.category} sx={{ mt: 0.5 }} />
                        </>
                      } 
                    />
                  </ListItem>
                ))}
              </List>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }} 
                component={Link} 
                to="/admin/books"
              >
                View All Books
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader 
              title="Recent Activity" 
              action={
                <IconButton>
                  <MoreVert />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <List>
                {stats.userActivity.map((activity, index) => (
                  <ListItem key={index} divider={index < stats.userActivity.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 
                        activity.type === 'login' ? 'success.main' : 
                        activity.type === 'book_read' ? 'info.main' : 
                        activity.type === 'review' ? 'warning.main' : 
                        'primary.main'
                      }}>
                        {activity.type === 'login' ? <PersonAdd /> : 
                         activity.type === 'book_read' ? <Visibility /> : 
                         activity.type === 'review' ? <Star /> : 
                         <Book />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={
                        activity.type === 'login' ? `${activity.user} logged in` :
                        activity.type === 'book_read' ? `${activity.user} read ${activity.book}` :
                        activity.type === 'review' ? `${activity.user} reviewed ${activity.book}` :
                        `${activity.user} favorited ${activity.book}`
                      } 
                      secondary={activity.time} 
                    />
                  </ListItem>
                ))}
              </List>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }} 
                component={Link} 
                to="/admin/reports"
              >
                View Activity Log
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard; 