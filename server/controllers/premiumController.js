const PremiumAccount = require('../models/PremiumAccount');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a premium account
exports.createPremiumAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionType } = req.body;
    const userId = req.user.id;

    // Check if user already has an active premium account
    const existingAccount = await PremiumAccount.findOne({ 
      user: userId,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    if (existingAccount) {
      return res.status(400).json({ message: 'User already has an active premium account' });
    }

    // Calculate end date based on subscription type
    const startDate = new Date();
    const endDate = new Date();
    if (subscriptionType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create new premium account
    const premiumAccount = new PremiumAccount({
      user: userId,
      subscriptionType,
      startDate,
      endDate,
      isActive: true,
      features: {
        unlimitedReading: true,
        offlineAccess: true,
        prioritySupport: true
      }
    });

    await premiumAccount.save();

    // Update user's premium status
    await User.findByIdAndUpdate(userId, { 
      isPremium: true,
      premiumExpiry: endDate
    });

    res.status(201).json({
      message: 'Premium account created successfully',
      premiumAccount
    });
  } catch (error) {
    console.error('Error creating premium account:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get premium status
exports.getPremiumStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // First check if user has premium status in User model
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        isActive: false,
        message: 'User not found' 
      });
    }

    // Then check for active premium account
    const premiumAccount = await PremiumAccount.findOne({ 
      user: userId,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    // If no active premium account but user has premium status, update user
    if (!premiumAccount && user.isPremium) {
      await User.findByIdAndUpdate(userId, { isPremium: false });
      return res.json({ 
        isActive: false,
        message: 'Premium subscription expired' 
      });
    }

    // If active premium account but user doesn't have premium status, update user
    if (premiumAccount && !user.isPremium) {
      await User.findByIdAndUpdate(userId, { isPremium: true });
    }

    res.json({
      isActive: !!premiumAccount,
      subscriptionType: premiumAccount?.subscriptionType,
      endDate: premiumAccount?.endDate,
      features: premiumAccount?.features
    });
  } catch (error) {
    console.error('Error getting premium status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel premium subscription
exports.cancelPremium = async (req, res) => {
  try {
    const userId = req.user.id;

    const premiumAccount = await PremiumAccount.findOne({ user: userId });
    if (!premiumAccount) {
      return res.status(404).json({ message: 'No premium account found' });
    }

    // Update premium account status
    premiumAccount.isActive = false;
    await premiumAccount.save();

    // Update user's premium status
    await User.findByIdAndUpdate(userId, { isPremium: false });

    res.json({
      message: 'Premium subscription cancelled successfully',
      premiumAccount
    });
  } catch (error) {
    console.error('Error cancelling premium subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin-only: Set user's premium status (for manual adjustment)
exports.setUserPremiumStatus = async (req, res) => {
    try {
        const { userId, isPremium, durationMonths } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update premium status
        user.isPremium = isPremium === true;
        
        // If isPremium is true and duration is provided, set expiry date
        if (isPremium && durationMonths) {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + parseInt(durationMonths));
            user.premiumExpiry = expiryDate;
        } else if (!isPremium) {
            // If setting to non-premium, remove expiry date
            user.premiumExpiry = null;
        }
        
        await user.save();
        
        res.json({
            message: `User premium status ${user.isPremium ? 'activated' : 'deactivated'} successfully`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isPremium: user.isPremium,
                premiumExpiry: user.premiumExpiry
            }
        });
    } catch (error) {
        console.error('Error setting premium status:', error);
        res.status(500).json({ message: 'Error setting premium status', error: error.message });
    }
}; 