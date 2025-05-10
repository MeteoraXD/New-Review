import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, Paper } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

const ProtectedRoute = ({ children, requiredRole, requiresPremium, premiumMessage }) => {
    const { user, loading, isAdmin, isAuthor, hasPremiumAccess } = useAuth();

    // Show loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                <Typography variant="h6">Loading...</Typography>
            </Box>
        );
    }

    // If not logged in, redirect to login
    if (!user) {
        return <Navigate to="/login" />;
    }

    // ----- Role-based access control -----
    
    // Check if premium access is required
    if (requiresPremium) {
        // Admins and authors always have premium access
        if (user.role !== 'admin' && user.role !== 'author' && !hasPremiumAccess()) {
            // Regular users need to have valid premium access
            return (
                <Paper elevation={3} sx={{ 
                    maxWidth: 600, 
                    mx: 'auto', 
                    mt: 8, 
                    p: 4, 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <LockOutlined sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                    <Typography variant="h5" color="primary" gutterBottom>
                        Premium Content Restricted
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {premiumMessage || 'This content is only available to premium users, authors, and administrators.'}
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={() => window.location.href='/premium'}
                    >
                        Upgrade to Premium
                    </Button>
                </Paper>
            );
        }
    }

    // If a specific role is required
    if (requiredRole) {
        // Admin can access everything
        if (user.role === 'admin') {
            return children;
        }
        
        // For author-required routes, both authors and admins can access
        if (requiredRole === 'author' && user.role === 'author') {
            return children;
        }
        
        // For admin-required routes, only admins can access
        if (requiredRole === 'admin' && user.role !== 'admin') {
            return (
                <Paper elevation={3} sx={{ 
                    maxWidth: 600, 
                    mx: 'auto', 
                    mt: 8, 
                    p: 4, 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <LockOutlined sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                    <Typography variant="h5" color="error" gutterBottom>
                        Admin Access Required
                    </Typography>
                    <Typography variant="body1" paragraph>
                        This section is restricted to administrators only. You don't have sufficient permissions.
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={() => window.location.href='/'}
                    >
                        Return to Home
                    </Button>
                </Paper>
            );
        }
        
        // For other roles, redirect home with access denied
        return (
            <Paper elevation={3} sx={{ 
                maxWidth: 600, 
                mx: 'auto', 
                mt: 8, 
                p: 4, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
            }}>
                <LockOutlined sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                    Access Denied
                </Typography>
                <Typography variant="body1" paragraph>
                    You don't have permission to access this page. This content requires {requiredRole} privileges.
                </Typography>
                <Button 
                    variant="contained" 
                    onClick={() => window.location.href='/'}
                >
                    Return to Home
                </Button>
            </Paper>
        );
    }

    // User is authenticated with appropriate permissions
    if (typeof children === 'function') {
        // Pass auth context to function children
        return children({ user, isAdmin, isAuthor, hasPremiumAccess });
    }
    
    // Regular component children
    return children;
};

export default ProtectedRoute; 