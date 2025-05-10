const axios = require('axios');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const PremiumStatus = require('../models/PremiumStatus');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const Payment = require('../models/Payment');

// Khalti test mode configuration
const KHALTI_SECRET_KEY = 'test_secret_key_7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b'; // Test secret key
const KHALTI_VERIFY_URL = 'https://khalti.com/api/v2/payment/verify/';
const KHALTI_INITIATE_URL = 'https://khalti.com/api/v2/payment/initiate/';

const initiateKhaltiPayment = async (req, res) => {
  try {
    const { amount, return_url } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Khalti API endpoint
    const khaltiEndpoint = 'https://a.khalti.com/api/v2/epayment/initiate/';

    // Prepare payment data
    const paymentData = {
      return_url: return_url || `${process.env.FRONTEND_URL}/payment/success`,
      website_url: process.env.FRONTEND_URL,
      amount: amount * 100, // Convert to paisa
      purchase_order_id: `PO-${Date.now()}`,
      purchase_order_name: 'Premium Subscription',
      customer_info: {
        name: user.username,
        email: user.email,
        phone: user.phone || ''
      }
    };

    // Make request to Khalti
    const response = await axios.post(khaltiEndpoint, paymentData, {
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.payment_url) {
      // Create payment record
      const payment = new Payment({
        user: user._id,
        amount,
        paymentMethod: 'khalti',
        status: 'pending',
        paymentId: response.data.pidx
      });

      await payment.save();

      res.json({
        success: true,
        payment_url: response.data.payment_url,
        pidx: response.data.pidx
      });
    } else {
      throw new Error('Failed to initiate payment');
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.detail || 'Failed to initiate payment'
    });
  }
};

const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Khalti verification endpoint
    const khaltiEndpoint = `https://a.khalti.com/api/v2/epayment/lookup/`;

    // Verify payment with Khalti
    const response = await axios.post(khaltiEndpoint, { pidx }, {
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.status === 'Completed') {
      // Update payment record
      const payment = await Payment.findOne({ paymentId: pidx });
      if (payment) {
        payment.status = 'completed';
        await payment.save();

        // Update user's premium status
        const subscriptionType = payment.amount === 100 ? 'monthly' : 'yearly';
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (subscriptionType === 'monthly' ? 1 : 12));

        await User.findByIdAndUpdate(user._id, {
          isPremium: true,
          premiumExpiryDate: expiryDate,
          subscriptionType
        });

        res.json({
          success: true,
          message: 'Payment verified successfully'
        });
      } else {
        throw new Error('Payment record not found');
      }
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.detail || 'Failed to verify payment'
    });
  }
};

const getSubscriptionHistory = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error getting subscription history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting subscription history',
      error: error.message
    });
  }
};

module.exports = {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  getSubscriptionHistory
}; 