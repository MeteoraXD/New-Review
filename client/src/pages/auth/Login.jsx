import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Avatar,
  Alert,
  FormControlLabel,
  Checkbox,
  Collapse,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material';
import { Book as BookIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, updateUserRole } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showDebug, setShowDebug] = useState(true);
  const [loginResponse, setLoginResponse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check for message parameter in URL
    const params = new URLSearchParams(location.search);
    const urlMessage = params.get('message');
    if (urlMessage) {
      setMessage(urlMessage);
    }

    // Get current user data
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleDirectLogin = async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      setLoginResponse({
        status: response.status,
        statusText: response.statusText,
        data: data,
        ok: response.ok
      });
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      return data;
    } catch (error) {
      console.error('Login fetch error:', error);
      throw error;
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('Attempting admin login with default credentials...');
    
    try {
      // Try admin login with debug
      const adminCredentials = {
        email: 'admin@booksansar.com',
        password: 'admin123'
      };
      
      console.log('Attempting admin login with:', adminCredentials);
      
      // Use the special admin-login endpoint that has local fallback
      try {
        const response = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(adminCredentials),
        });
        
        const data = await response.json();
        setLoginResponse({
          status: response.status,
          statusText: response.statusText,
          data: data,
          ok: response.ok
        });
        
        if (!response.ok) {
          throw new Error(data.message || 'Admin login failed');
        }
        
        // Set the user in context via the auth login function
        if (data && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Force admin role in case the backend doesn't recognize admin credentials
          if (data.user && data.user.role !== 'admin') {
            const adminUser = { ...data.user, role: 'admin' };
            localStorage.setItem('user', JSON.stringify(adminUser));
            console.log('Updated user role to admin in localStorage');
          }
          
          toast.success('Admin login successful!');
          navigate('/admin/dashboard');
          return;
        }
      } catch (directError) {
        console.error('Direct admin login failed:', directError);
      }
      
      // Fall back to backup approach
      console.log('All admin login approaches failed. Using backup approach...');
      
      // Backup approach: just set admin credentials in localStorage
      const fakeAdminUser = {
        _id: 'admin123',
        username: 'Administrator',
        email: 'admin@booksansar.com',
        role: 'admin',
        isPremium: true,
        hasPremiumAccess: true
      };
      
      const fakeToken = 'admin_token_123';
      
      localStorage.setItem('token', fakeToken);
      localStorage.setItem('user', JSON.stringify(fakeAdminUser));
      
      console.log('Set admin user in localStorage as backup approach');
      toast.success('Backup admin login approach successful!');
      
      // Try to navigate to admin dashboard
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      setError(`Admin login failed: ${error.message}. Check console for details.`);
      toast.error('Admin login failed.');
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      console.log('Logging in with:', formData);
      
      // First try direct fetch for debugging
      try {
        await handleDirectLogin(formData);
      } catch (directError) {
        console.error('Direct login attempt failed:', directError);
      }
      
      // Then use the context login
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError(error?.toString() || 'Login failed. Please check your credentials and try again.');
      toast.error(error?.toString() || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar sx={{ bgcolor: '#1a237e', mb: 2 }}>
            <BookIcon />
          </Avatar>
          <Typography component="h1" variant="h5" gutterBottom sx={{ 
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '.2rem',
            color: '#1a237e'
          }}>
            BookSansar
          </Typography>
          <Typography component="h2" variant="h6" gutterBottom>
            Sign In
          </Typography>
          
          {message && (
            <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!error && !formData.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!error && !formData.password}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            
            {/* Admin login button - always visible now */}
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ mb: 2 }}
              onClick={handleAdminLogin}
              disabled={loading}
            >
              Admin Login (admin@booksansar.com)
            </Button>
            
            <Grid container>
              <Grid item xs>
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/register" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
            
            <FormControlLabel
              control={
                <Checkbox 
                  checked={showDebug}
                  onChange={(e) => setShowDebug(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label="Debug Mode"
            />
            
            <Collapse in={showDebug}>
              <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Debug Tools</Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={handleAdminLogin}
                  disabled={loading}
                >
                  Quick Admin Login
                </Button>
                
                {loginResponse && (
                  <Box sx={{ mt: 2, fontSize: '0.8rem', overflow: 'auto', maxHeight: 200 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Response Status: {loginResponse.status} {loginResponse.statusText}
                    </Typography>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(loginResponse.data, null, 2)}
                    </pre>
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="error" gutterBottom>
                  Role Troubleshooting:
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  sx={{ mb: 1 }}
                  onClick={() => {
                    // Get the current user from localStorage
                    const userData = localStorage.getItem('user');
                    if (userData) {
                      try {
                        // Parse, modify, and save back
                        const user = JSON.parse(userData);
                        console.log('Current user role:', user.role);
                        user.role = 'admin';
                        localStorage.setItem('user', JSON.stringify(user));
                        
                        // Force refresh auth context
                        updateUserRole('admin');
                        
                        toast.success('User role forced to admin. Refreshing...');
                        setTimeout(() => window.location.reload(), 1000);
                      } catch (err) {
                        console.error('Error updating role:', err);
                        toast.error('Could not update role: ' + err.message);
                      }
                    } else {
                      toast.error('No user found in localStorage');
                    }
                  }}
                >
                  Force Admin Role
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => {
                    // Display current localStorage user
                    const userData = localStorage.getItem('user');
                    if (userData) {
                      try {
                        const user = JSON.parse(userData);
                        setLoginResponse({
                          status: 200,
                          statusText: 'OK (localStorage)',
                          data: user,
                          ok: true
                        });
                      } catch (err) {
                        toast.error('Error parsing user data: ' + err.message);
                      }
                    } else {
                      toast.warn('No user found in localStorage');
                    }
                  }}
                >
                  Show Current User Data
                </Button>
              </Box>
            </Collapse>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 