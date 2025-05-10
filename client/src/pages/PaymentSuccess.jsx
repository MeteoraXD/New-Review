import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Button, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const PaymentSuccess = () => {
    const { updateUserData } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Function to verify payment on component mount
        const verifyPayment = async () => {
            try {
                setLoading(true);
                
                // Parse URL parameters from Khalti callback
                const queryParams = new URLSearchParams(location.search);
                const pidx = queryParams.get('pidx');
                const status = queryParams.get('status');
                const txnId = queryParams.get('transaction_id');
                
                console.log('Payment callback received:', { pidx, status, txnId });
                
                if (!pidx) {
                    setError('Payment information is missing');
                    setStatus('failed');
                    setLoading(false);
                    return;
                }
                
                // Get the stored plan_id from local storage
                const plan_id = localStorage.getItem('khalti_plan_id');
                
                // Verify the payment with the server
                const lookupResponse = await axios.post('/api/users/premium/lookup', { 
                    pidx,
                    plan_id
                });
                
                console.log('Payment lookup response:', lookupResponse.data);
                
                if (lookupResponse.data.success) {
                    setStatus('success');
                    setMessage('Payment successful! Your premium subscription has been activated.');
                    
                    // Update user data in context if available
                    if (lookupResponse.data.user) {
                        updateUserData({
                            isPremium: true,
                            premiumExpiry: lookupResponse.data.user.premiumExpiry
                        });
                    }
                    
                    // Clear the temporary data
                    localStorage.removeItem('khalti_pidx');
                    localStorage.removeItem('khalti_plan_id');
                } else {
                    // Payment was not successful
                    setStatus('failed');
                    setError(lookupResponse.data.message || 'Payment verification failed');
                }
            } catch (err) {
                console.error('Error verifying payment:', err);
                setStatus('failed');
                setError('Failed to verify payment: ' + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };
        
        verifyPayment();
    }, [location.search, updateUserData]);
    
    const handleBackToPremium = () => {
        navigate('/premium');
    };
    
    const handleBackToHome = () => {
        navigate('/');
    };
    
    if (loading) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minHeight: '70vh',
                    padding: 4
                }}
            >
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Verifying your payment...
                </Typography>
            </Box>
        );
    }
    
    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 4 }}>
            <Paper elevation={3} sx={{ padding: 4, textAlign: 'center' }}>
                {status === 'success' ? (
                    <>
                        <CheckCircleIcon color="success" sx={{ fontSize: 80 }} />
                        <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
                            Payment Successful!
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {message}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Thank you for upgrading to premium! You now have access to all premium content.
                        </Typography>
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button 
                                variant="outlined" 
                                startIcon={<ArrowBackIcon />} 
                                onClick={handleBackToHome}
                            >
                                Back to Home
                            </Button>
                        </Box>
                    </>
                ) : (
                    <>
                        <ErrorIcon color="error" sx={{ fontSize: 80 }} />
                        <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
                            Payment Failed
                        </Typography>
                        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
                        <Typography variant="body1" paragraph>
                            We were unable to verify your payment. Please try again or contact support.
                        </Typography>
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleBackToPremium}
                            >
                                Try Again
                            </Button>
                            <Button 
                                variant="outlined" 
                                startIcon={<ArrowBackIcon />} 
                                onClick={handleBackToHome}
                            >
                                Back to Home
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default PaymentSuccess; 