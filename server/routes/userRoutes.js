const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const localUserController = require('../controllers/localUserController');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Function to check if MongoDB is connected
const isMongoDB = () => mongoose.connection.readyState === 1;

// Auth protected routes
router.get('/profile', auth, userController.getProfile);
router.get('/dashboard', auth, userController.getDashboardStats);
router.put('/profile', auth, userController.updateProfile);
router.post('/premium/upgrade', auth, userController.upgradeToPremium);
router.post('/premium/verify-payment', auth, userController.verifyKhaltiPayment);
router.post('/premium/verify-by-pidx', auth, userController.verifyKhaltiPaymentByPidx);
router.post('/premium/initiate', auth, userController.initiateKhaltiPayment);
router.get('/payment-methods', auth, userController.getSavedPaymentMethods);

// Bank transfer verification with MongoDB/local storage fallback
router.post('/premium/verify-bank-transfer', auth, (req, res) => {
    // If MongoDB is connected, use the MongoDB implementation
    if (isMongoDB()) {
        console.log('Using MongoDB implementation for bank transfer verification');
        return userController.verifyBankTransfer(req, res);
    } else {
        // Otherwise use the local JSON storage implementation
        console.log('Using local storage implementation for bank transfer verification');
        return localUserController.verifyBankTransfer(req, res);
    }
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/check-token', auth, authController.checkToken);

// Create a special route for direct premium activation (no payment required)
// FOR TESTING ONLY - Remove in production
router.post('/direct-premium', async (req, res) => {
    try {
        const { userId, duration } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID is required' 
            });
        }
        
        console.log('==== DIRECT PREMIUM ACTIVATION ====');
        console.log('Attempting to directly activate premium for user:', userId);
        
        // Find user - try MongoDB first, then local storage
        let user = null;
        
        if (isMongoDB()) {
            // Use MongoDB
            const User = require('../models/User');
            user = await User.findById(userId);
        } else {
            // Use local storage
            const getUsers = () => {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
                    if (!fs.existsSync(USERS_FILE)) return [];
                    const data = fs.readFileSync(USERS_FILE, 'utf8');
                    return JSON.parse(data);
                } catch (err) {
                    console.error('Error reading users file:', err);
                    return [];
                }
            };
            
            const saveUsers = (users) => {
                const fs = require('fs');
                const path = require('path');
                const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
                fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            };
            
            const users = getUsers();
            const userIndex = users.findIndex(u => u._id === userId);
            
            if (userIndex !== -1) {
                user = users[userIndex];
                
                // Store users and userIndex for later saving
                user._localIndex = userIndex;
                user._localUsers = users;
                user._localSave = saveUsers;
            }
        }
        
        if (!user) {
            console.log('User not found with ID:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Calculate premium days
        let premiumDays = 30; // default 1 month
        if (duration === 'yearly') {
            premiumDays = 365; // 1 year
        }
        
        // Calculate expiry date
        let expiryDate;
        if (user.isPremium && user.premiumExpiry && new Date(user.premiumExpiry) > new Date()) {
            // Extend current premium
            expiryDate = new Date(user.premiumExpiry);
            expiryDate.setDate(expiryDate.getDate() + premiumDays);
        } else {
            // New premium
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + premiumDays);
        }
        
        // Update user premium status
        user.isPremium = true;
        user.premiumExpiry = expiryDate;
        
        // Save user data
        if (isMongoDB()) {
            // Save to MongoDB
            await user.save();
        } else if (user._localSave && typeof user._localIndex === 'number') {
            // Save to local storage
            const users = user._localUsers;
            users[user._localIndex] = {
                ...user,
                premiumExpiry: expiryDate.toISOString() // Format date for JSON storage
            };
            // Remove helper properties
            delete users[user._localIndex]._localIndex;
            delete users[user._localIndex]._localUsers;
            delete users[user._localIndex]._localSave;
            
            user._localSave(users);
        }
        
        console.log('Premium activated successfully:');
        console.log('- User:', user.username);
        console.log('- Expiry:', expiryDate);
        console.log('- Days:', premiumDays);
        
        return res.status(200).json({
            success: true,
            message: 'Premium activated successfully',
            user: {
                id: user._id,
                isPremium: true,
                premiumExpiry: expiryDate,
                daysRemaining: premiumDays
            }
        });
    } catch (error) {
        console.error('Error activating premium directly:', error);
        return res.status(500).json({
            success: false,
            message: 'Error activating premium',
            error: error.message
        });
    }
});

module.exports = router; 