const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const PremiumAccount = require('../models/PremiumAccount');

// Get User model if MongoDB is connected
let UserModel;
try {
  UserModel = require('../models/User');
} catch (err) {
  console.error('Could not load User model:', err.message);
}

// Path to local users file for fallback
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Get users from local storage
const getLocalUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
};

// Find user by ID from local storage
const findUserById = (userId) => {
  const users = getLocalUsers();
  return users.find(user => user._id === userId);
};

// Main authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Use consistent userId field
    const userId = decoded.userId || decoded.id;
    
    const user = await UserModel.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check premium status
    const premiumAccount = await PremiumAccount.findOne({ 
      user: user._id,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    // Update user's premium status
    user.isPremium = !!premiumAccount;
    await user.save();

    // Set consistent user object
    req.user = {
      ...user.toObject(),
      id: user._id.toString(),
      userId: user._id.toString()
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  
  next();
};

// Check if user is author or admin
const isAuthorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'author' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Author privileges required.' });
  }
  
  next();
};

// Check if user is the resource owner or an admin
const isOwnerOrAdmin = (paramIdField) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Admin has full access to all resources
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Get ID of the resource
    const resourceId = req.params[paramIdField];
    if (!resourceId) {
      return res.status(400).json({ message: 'Resource ID is required' });
    }
    
    // Check if the resource belongs to the user
    if (req.resourceUserId && req.resourceUserId.toString() === req.user.userId.toString()) {
      return next();
    }
    
    return res.status(403).json({ message: 'Access denied. You do not own this resource.' });
  };
};

// Check if user has premium access
const isPremiumUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Admin always has premium access
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      try {
        // Get full user to check premium status properly
        const user = await UserModel.findById(req.user.userId);
        
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }
        
        // Check premium status using method if available
        if (typeof user.hasPremiumAccess === 'function') {
          if (!user.hasPremiumAccess()) {
            return res.status(403).json({ message: 'Premium access required for this content' });
          }
        } else if (!user.isPremium) {
          return res.status(403).json({ message: 'Premium access required for this content' });
        }
      } catch (dbError) {
        console.error('Database error when checking premium status:', dbError);
        // Fall back to req.user if DB error
        if (!req.user.isPremium) {
          return res.status(403).json({ message: 'Premium access required for this content' });
        }
      }
    } else {
      // Use req.user if MongoDB not connected
      if (!req.user.isPremium) {
        return res.status(403).json({ message: 'Premium access required for this content' });
      }
    }
    
    next();
  } catch (error) {
    console.error('Premium check error:', error);
    return res.status(500).json({ message: 'Server error during premium access check', error: error.message });
  }
};

// Export all middleware functions using the original names for backward compatibility
module.exports = auth;
module.exports.authenticateToken = auth;
module.exports.isAdmin = isAdmin;
module.exports.isAuthorOrAdmin = isAuthorOrAdmin;
module.exports.isOwnerOrAdmin = isOwnerOrAdmin;
module.exports.isPremiumUser = isPremiumUser; 