import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { toast } from 'react-toastify';

const PremiumUpgrade = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const plans = [
        {
            id: 'monthly',
            name: 'Monthly Premium',
            price: 100,
            features: [
                'Unlimited access to premium books',
                'Ad-free reading experience',
                'Priority support',
                'Auto-approved reviews'
            ]
        },
        {
            id: 'yearly',
            name: 'Yearly Premium',
            price: 1000,
            features: [
                'All monthly features',
                'Save 20% compared to monthly',
                'Early access to new books',
                'Exclusive content'
            ]
        }
    ];

    const handleUpgrade = async (plan) => {
        if (!user) {
            toast.error('Please log in to upgrade to premium');
            navigate('/login');
            return;
        }

        setLoading(true);
        setSelectedPlan(plan);

        try {
            // Initiate Khalti payment
            const response = await axios.post('/api/payments/khalti/initiate', {
                amount: plan.price,
                subscriptionType: plan.id
            });

            if (response.data.success) {
                // Redirect to Khalti payment page
                window.location.href = response.data.data.paymentUrl;
            } else {
                toast.error(response.data.message || 'Failed to initiate payment');
            }
        } catch (error) {
            console.error('Error initiating payment:', error);
            toast.error(error.response?.data?.message || 'Error initiating payment');
        } finally {
            setLoading(false);
        }
    };

    // Handle payment success callback
    const handlePaymentSuccess = async () => {
        try {
            // Verify payment
            const response = await axios.post('/api/payments/khalti/verify', {
                pidx: new URLSearchParams(window.location.search).get('pidx')
            });

            if (response.data.success) {
                toast.success('Payment successful! Your premium status has been updated.');
                // Update user context with new premium status
                updateUser({
                    ...user,
                    isPremium: true,
                    premiumExpiry: response.data.data.subscriptionEndDate
                });
                navigate('/profile');
            } else {
                toast.error(response.data.message || 'Payment verification failed');
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error(error.response?.data?.message || 'Error verifying payment');
        }
    };

    // Check if this is a payment success callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('pidx')) {
            handlePaymentSuccess();
        }
    }, []);

    if (user?.isPremium) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="info">
                    You already have a premium subscription!
                </Alert>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/profile')}
                    sx={{ mt: 2 }}
                >
                    Go to Profile
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom align="center">
                Upgrade to Premium
            </Typography>
            <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
                Choose a plan that suits you best
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                {plans.map((plan) => (
                    <Grid item xs={12} md={6} key={plan.id}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                border: selectedPlan?.id === plan.id ? '2px solid #1976d2' : '1px solid #e0e0e0'
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" gutterBottom>
                                    {plan.name}
                                </Typography>
                                <Typography variant="h4" color="primary" gutterBottom>
                                    NPR {plan.price}
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    {plan.features.map((feature, index) => (
                                        <Typography key={index} variant="body1" sx={{ mb: 1 }}>
                                            ✓ {feature}
                                        </Typography>
                                    ))}
                                </Box>
                            </CardContent>
                            <Box sx={{ p: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleUpgrade(plan)}
                                    disabled={loading}
                                    startIcon={loading && selectedPlan?.id === plan.id ? <CircularProgress size={20} /> : null}
                                >
                                    {loading && selectedPlan?.id === plan.id ? 'Processing...' : 'Upgrade Now'}
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ mt: 4, p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Payment Information
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    We use Khalti for secure payments. You'll be redirected to Khalti's payment page to complete your transaction.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Test Card Details:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Card Number: 4242 4242 4242 4242
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Expiry: Any future date
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    CVV: Any 3 digits
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    OTP: 123456
                </Typography>
            </Paper>
        </Container>
    );
};

export default PremiumUpgrade; 