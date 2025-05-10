const express = require('express');
const router = express.Router();
const localAuthController = require('../controllers/localAuthController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', localAuthController.register);
router.post('/login', localAuthController.login);

// Token refresh endpoints - provide both paths for compatibility
router.post('/refresh-token', authMiddleware, localAuthController.refreshToken);
router.post('/local/refresh-token', authMiddleware, localAuthController.refreshToken);

// Protected routes
router.get('/profile', authMiddleware, localAuthController.getProfile);
router.put('/profile', authMiddleware, localAuthController.updateProfile);

// Admin routes
router.post('/create-admin', localAuthController.createAdmin);

module.exports = router; 