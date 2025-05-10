const jwt = require('jsonwebtoken'); // For verifying JWT tokens
const User = require('./../server/models/User'); // User model for database operations

// Middleware to authenticate users using JWT
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Decoded JWT:', decoded);
        
        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Set user in request
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const authAdmin = async (req, res, next) => {
    try {
        // First, run the regular auth middleware
        auth(req, res, () => {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admin only.' });
            }
            next();
        });
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const authAuthor = async (req, res, next) => {
    try {
        // First, run the regular auth middleware
        auth(req, res, () => {
            // Check if user is author
            if (req.user.role !== 'author' && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Author only.' });
            }
            next();
        });
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Middleware to check if the user has the required role(s)
const checkRole = (roles) => {
    return (req, res, next) => {
        // Check if the user's role is included in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' }); // Deny access if the role is not allowed
        }
        next(); // Proceed to the next middleware or route handler
    };
};

// Export the middleware functions for use in other parts of the application
module.exports = { auth, authAdmin, authAuthor, checkRole };