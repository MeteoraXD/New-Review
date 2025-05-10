import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Payment = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handlePayment = async (amount) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                toast.error('Please log in to make a payment');
                navigate('/login');
                return;
            }

            const response = await axios.post('/api/payments/khalti/initiate', {
                amount,
                return_url: `${window.location.origin}/payment/success`
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                // Redirect to Khalti payment page
                window.location.href = response.data.payment_url;
            } else {
                toast.error('Failed to initiate payment');
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Upgrade to Premium
            </Typography>
            
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Choose your plan:
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handlePayment(100)}
                        disabled={loading}
                        sx={{ flex: 1 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Monthly Plan - Rs. 100'}
                    </Button>
                    
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handlePayment(1000)}
                        disabled={loading}
                        sx={{ flex: 1 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Yearly Plan - Rs. 1000'}
                    </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                    * Payment will be processed through Khalti
                </Typography>
            </Box>
        </Box>
    );
};

export default Payment; 