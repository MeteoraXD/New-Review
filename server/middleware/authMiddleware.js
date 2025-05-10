const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Get token from request headers
const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

// Authenticate JWT middleware
exports.authenticateJWT = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied, admin privileges required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
}; 