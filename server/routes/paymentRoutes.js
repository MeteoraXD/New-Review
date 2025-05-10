const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { initiateKhaltiPayment, verifyKhaltiPayment } = require('../controllers/paymentController');
const { paymentValidation } = require('../middleware/paymentValidation');

// Khalti payment routes
router.post('/khalti/initiate', auth, paymentValidation, initiateKhaltiPayment);
router.post('/khalti/verify', auth, verifyKhaltiPayment);

// Get subscription history
router.get('/history', auth, paymentController.getSubscriptionHistory);

// Payment success callback
router.get('/success', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Payment successful'
    });
});

// Payment failure callback
router.get('/failure', (req, res) => {
    res.status(400).json({
        success: false,
        message: 'Payment failed'
    });
});

module.exports = router; 