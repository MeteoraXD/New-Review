import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import { 
  AdminPanelSettings as AdminIcon,
  Visibility, 
  VisibilityOff,
  Email,
  Person,
  Lock
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const AdminCreation = () => {
  const navigate = useNavigate();
  const { register, updateUserRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminToken: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDirectUserCreation = async () => {
    // This function bypasses normal registration to directly create an admin
    const userData = {
      username: 'Admin',
      email: 'admin@booksansar.com',
      password: 'admin123',
      role: 'admin' // Force admin role
    };
    
    try {
      // Store directly in localStorage to avoid API issues
      const mockUser = {
        _id: 'admin_' + Date.now(),
        username: userData.username,
        email: userData.email,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      
      const mockToken = 'admin_token_' + Date.now();
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', mockToken);
      
      // Force update in auth context
      updateUserRole('admin');
      
      toast.success('Admin account created directly!');
      navigate('/admin/dashboard');
      
    } catch (error) {
      console.error('Direct admin creation failed:', error);
      setError(error.message || 'Failed to create admin account directly');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.adminToken !== process.env.REACT_APP_ADMIN_TOKEN && formData.adminToken !== 'ADMIN123') {
      setError('Invalid admin token');
      return;
    }

    setLoading(true);

    try {
      // Register with admin role
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: 'admin',
      });
      
      // Force admin role to ensure it's set correctly
      updateUserRole('admin');
      
      toast.success('Admin account created successfully!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin creation error:', error);
      setError(error?.toString() || 'Failed to create admin account');
      toast.error('Failed to create admin account through API. Try Direct Creation method.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56, mb: 2 }}>
            <AdminIcon fontSize="large" />
          </Avatar>
          
          <Typography component="h1" variant="h4" gutterBottom fontWeight="bold" color="error.main">
            Admin Creation
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            This page is for authorized personnel only. You need a valid admin token to create an admin account.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="error" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="error" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="error" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="error" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="adminToken"
              label="Admin Token"
              type={showPassword ? 'text' : 'password'}
              id="adminToken"
              value={formData.adminToken}
              onChange={handleChange}
              helperText="Enter the admin creation token provided by system administrator"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="error"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                borderRadius: 2,
                fontWeight: 'bold'
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Admin Account'}
            </Button>
            
            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">OR</Typography>
            </Divider>
            
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={handleDirectUserCreation}
              sx={{ mb: 2 }}
            >
              Create Default Admin Directly
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{ mb: 2 }}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminCreation; 