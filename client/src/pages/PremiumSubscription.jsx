import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import PremiumPlans from '../components/PremiumPlans';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PremiumSubscription = () => {
    const { user, loading } = useAuth();
    
    // Redirect to login if not authenticated
    if (!loading && !user) {
        return <Navigate to="/login?redirect=/premium" />;
    }
    
    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
                    Upgrade to Premium
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 3 }}>
                    Unlock exclusive content and enhance your reading experience
                </Typography>
                <Divider sx={{ mb: 4 }} />
                
                <Box sx={{ mb: 4 }}>
                    <PremiumPlans />
                </Box>
            </Paper>
            
            <Paper elevation={2} sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                <Typography variant="body2" color="text.secondary" align="center">
                    Note: This is a test payment system. No real transactions will occur.
                    For testing purposes, use the Khalti test credentials.
                </Typography>
            </Paper>
        </Container>
    );
};

export default PremiumSubscription; 