const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const premiumController = require('../controllers/premiumController');
const auth = require('../middleware/auth');

// @route   POST /api/premium/create
// @desc    Create a premium account
// @access  Private
router.post(
  '/create',
  [
    auth,
    check('subscriptionType', 'Subscription type is required')
      .isIn(['monthly', 'yearly'])
  ],
  premiumController.createPremiumAccount
);

// @route   GET /api/premium/status
// @desc    Get premium account status
// @access  Private
router.get('/status', auth, premiumController.getPremiumStatus);

// @route   POST /api/premium/cancel
// @desc    Cancel premium subscription
// @access  Private
router.post('/cancel', auth, premiumController.cancelPremium);

module.exports = router; 