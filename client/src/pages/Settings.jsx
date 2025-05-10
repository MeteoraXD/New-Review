import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setSuccess('Password updated successfully');
      setOpenPasswordDialog(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');
    
    try {
      await axios.delete(`/api/admin/users/${user.id}`);
      logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4,
          borderRadius: 2,
          bgcolor: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            color: '#1a237e',
            mb: 3
          }}
        >
          Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <List>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Change Password" 
              secondary="Update your account password"
              secondaryTypographyProps={{ component: 'span' }}
            />
            <ListItemSecondaryAction>
              <Button 
                variant="outlined" 
                onClick={() => setOpenPasswordDialog(true)}
              >
                Change
              </Button>
            </ListItemSecondaryAction>
          </ListItem>

          <Divider variant="inset" component="li" />

          <ListItem sx={{ mt: 4 }}>
            <ListItemIcon>
              <DeleteIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary="Delete Account" 
              secondary="Permanently delete your account and all data"
              primaryTypographyProps={{ color: 'error', component: 'span' }}
              secondaryTypographyProps={{ component: 'span' }}
            />
            <ListItemSecondaryAction>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => setOpenDeleteDialog(true)}
              >
                Delete
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        </List>

        {/* Password Change Dialog */}
        <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                name="currentPassword"
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="newPassword"
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                fullWidth
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
            <Button 
              onClick={handlePasswordSubmit} 
              variant="contained" 
              color="primary"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete your account? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteAccount} 
              variant="contained" 
              color="error"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default Settings; 