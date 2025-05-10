import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    TextField,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Paper
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';

// Bank list for Nepal
const nepaliBanks = [
    "Nepal Bank Limited",
    "Rastriya Banijya Bank",
    "Nabil Bank",
    "Nepal Investment Bank",
    "Standard Chartered Bank Nepal",
    "Himalayan Bank",
    "Nepal SBI Bank",
    "Everest Bank",
    "Kumari Bank",
    "Laxmi Bank",
    "Citizens Bank International",
    "Prime Commercial Bank",
    "Sunrise Bank",
    "NIC Asia Bank",
    "Global IME Bank",
    "NMB Bank",
    "Prabhu Bank",
    "Siddhartha Bank",
    "Machhapuchhre Bank",
    "Civil Bank",
    "Century Commercial Bank",
    "Sanima Bank",
    "Mega Bank Nepal",
    "Nepal Bangladesh Bank",
    "Nepal Credit and Commerce Bank"
];

const SavedPaymentMethodSelector = ({ 
    onPaymentDetailsChange, 
    initialPaymentDetails = {}, 
    showSaveOption = true 
}) => {
    const { user } = useAuth();
    const [paymentTab, setPaymentTab] = useState(0);
    const [savedMethods, setSavedMethods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [paymentDetails, setPaymentDetails] = useState({
        bankName: initialPaymentDetails.bankName || '',
        accountNumber: initialPaymentDetails.accountNumber || '',
        contactNumber: initialPaymentDetails.contactNumber || '',
        transactionId: initialPaymentDetails.transactionId || '',
        savePaymentMethod: true,
        selectedMethodId: initialPaymentDetails.selectedMethodId || ''
    });
    
    // Fetch saved payment methods when component mounts
    useEffect(() => {
        fetchSavedPaymentMethods();
    }, [user]);
    
    // Fetch saved payment methods from server
    const fetchSavedPaymentMethods = async () => {
        if (!user) return;
        
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.get('/api/users/payment-methods', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data && response.data.success) {
                setSavedMethods(response.data.paymentMethods || []);
                
                // If we have saved methods and none is selected, select the default one
                if (response.data.paymentMethods?.length > 0 && !paymentDetails.selectedMethodId) {
                    const defaultMethod = response.data.paymentMethods.find(m => m.isDefault) 
                        || response.data.paymentMethods[0];
                    
                    if (defaultMethod) {
                        handleMethodSelect(defaultMethod._id || '0');
                    }
                }
                
                // If we have saved methods, default to that tab
                if (response.data.paymentMethods?.length > 0 && paymentTab !== 0) {
                    setPaymentTab(0);
                }
            }
        } catch (err) {
            console.error('Error fetching payment methods:', err);
            setError('Could not load your saved payment methods');
        } finally {
            setLoading(false);
        }
    };
    
    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setPaymentTab(newValue);
        
        // Reset some fields when changing tabs
        if (newValue === 0) {
            // Switching to saved methods tab
            if (savedMethods.length > 0) {
                const defaultMethod = savedMethods.find(m => m.isDefault) || savedMethods[0];
                handleMethodSelect(defaultMethod._id || '0');
            }
        } else {
            // Switching to new method tab
            setPaymentDetails(prev => ({
                ...prev,
                selectedMethodId: '',
                bankName: '',
                accountNumber: '',
                contactNumber: ''
            }));
        }
        
        // Notify parent component of the change
        if (onPaymentDetailsChange) {
            onPaymentDetailsChange({
                ...paymentDetails,
                useExistingMethod: newValue === 0
            });
        }
    };
    
    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updatedDetails = {
            ...paymentDetails,
            [name]: value
        };
        
        setPaymentDetails(updatedDetails);
        
        // Notify parent component of the change
        if (onPaymentDetailsChange) {
            onPaymentDetailsChange(updatedDetails);
        }
    };
    
    // Handle checkbox change
    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        const updatedDetails = {
            ...paymentDetails,
            [name]: checked
        };
        
        setPaymentDetails(updatedDetails);
        
        // Notify parent component of the change
        if (onPaymentDetailsChange) {
            onPaymentDetailsChange(updatedDetails);
        }
    };
    
    // Handle selecting a saved payment method
    const handleMethodSelect = (methodId) => {
        const method = savedMethods.find(m => 
            m._id === methodId || savedMethods.indexOf(m).toString() === methodId
        );
        
        if (method) {
            const updatedDetails = {
                ...paymentDetails,
                selectedMethodId: methodId,
                bankName: method.bankName || '',
                accountNumber: method.accountNumber || '',
                contactNumber: method.contactNumber || ''
            };
            
            setPaymentDetails(updatedDetails);
            
            // Notify parent component of the change
            if (onPaymentDetailsChange) {
                onPaymentDetailsChange({
                    ...updatedDetails,
                    useExistingMethod: true
                });
            }
        }
    };
    
    return (
        <Box sx={{ mt: 2 }}>
            {loading ? (
                <Box display="flex" justifyContent="center" my={3}>
                    <CircularProgress size={30} />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : (
                <>
                    {savedMethods.length > 0 && (
                        <Paper sx={{ mb: 3 }}>
                            <Tabs 
                                value={paymentTab}
                                onChange={handleTabChange}
                                variant="fullWidth"
                                sx={{ borderBottom: 1, borderColor: 'divider' }}
                            >
                                <Tab 
                                    icon={<CreditCardIcon fontSize="small" />}
                                    iconPosition="start"
                                    label="Use Saved Method" 
                                />
                                <Tab 
                                    icon={<AddCircleOutlineIcon fontSize="small" />}
                                    iconPosition="start"
                                    label="New Method" 
                                />
                            </Tabs>
                        </Paper>
                    )}
                    
                    {paymentTab === 0 && savedMethods.length > 0 ? (
                        // Saved methods tab
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Select one of your saved payment methods:
                            </Typography>
                            
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="saved-method-label">Payment Method</InputLabel>
                                <Select
                                    labelId="saved-method-label"
                                    id="saved-method-select"
                                    value={paymentDetails.selectedMethodId}
                                    onChange={(e) => handleMethodSelect(e.target.value)}
                                    label="Payment Method"
                                >
                                    {savedMethods.map((method, index) => (
                                        <MenuItem 
                                            key={method._id || index} 
                                            value={method._id || index.toString()}
                                        >
                                            {method.bankName} {method.isDefault ? '(Default)' : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            {paymentDetails.selectedMethodId && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                                    <Typography variant="body2">
                                        <strong>Bank:</strong> {paymentDetails.bankName}
                                    </Typography>
                                    {paymentDetails.contactNumber && (
                                        <Typography variant="body2">
                                            <strong>Contact:</strong> {paymentDetails.contactNumber}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    ) : (
                        // New method tab
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Enter your payment details:
                            </Typography>
                            
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="bank-label">Bank</InputLabel>
                                <Select
                                    labelId="bank-label"
                                    id="bank-select"
                                    name="bankName"
                                    value={paymentDetails.bankName}
                                    onChange={handleInputChange}
                                    label="Bank"
                                    required
                                >
                                    {nepaliBanks.map(bank => (
                                        <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Contact Number"
                                name="contactNumber"
                                value={paymentDetails.contactNumber}
                                onChange={handleInputChange}
                                placeholder="Your contact number"
                            />
                            
                            {showSaveOption && (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={paymentDetails.savePaymentMethod}
                                            onChange={handleCheckboxChange}
                                            name="savePaymentMethod"
                                            color="primary"
                                        />
                                    }
                                    label="Save this payment method for future use"
                                    sx={{ mt: 1 }}
                                />
                            )}
                        </Box>
                    )}
                    
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Transaction ID / Reference Number"
                        name="transactionId"
                        value={paymentDetails.transactionId}
                        onChange={handleInputChange}
                        required
                        helperText="The transaction ID or reference number from your bank transfer"
                    />
                </>
            )}
        </Box>
    );
};

export default SavedPaymentMethodSelector; 