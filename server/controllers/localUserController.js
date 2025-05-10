const fs = require('fs');
const path = require('path');

// Directory and file paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('Created data directory');
  // Create empty users file if it doesn't exist
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
}

// Helper function to get all users
const getUsers = () => {
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

// Helper function to save users
const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Find user by ID
const findUserById = (userId) => {
  const users = getUsers();
  return users.find(user => user._id === userId);
};

// Local implementation of verifyBankTransfer
exports.verifyBankTransfer = async (req, res) => {
  try {
    // Get userId from authentication or request body
    let userId = req.user?.userId;
    if (!userId && req.body.userId) {
      userId = req.body.userId;
    }
    
    const { 
      planId, 
      amount, 
      bankName, 
      transactionId, 
      contactNumber, 
      paymentDate 
    } = req.body;
    
    console.log('==== LOCAL BANK TRANSFER VERIFICATION START ====');
    console.log('Bank transfer verification request received:');
    console.log('- User ID:', userId);
    console.log('- Plan ID:', planId);
    console.log('- Amount:', amount);
    console.log('- Bank Name:', bankName);
    console.log('- Transaction ID:', transactionId);
    
    // Validate required fields
    if (!userId || !planId || !bankName || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required payment information' 
      });
    }
    
    // Find user in local storage
    const users = getUsers();
    const userIndex = users.findIndex(u => u._id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = users[userIndex];
    
    // Create a record of the bank transfer (for logs only in local mode)
    const bankTransfer = {
      userId: userId,
      planId: planId,
      amount: amount,
      bankName: bankName,
      transactionId: transactionId,
      contactNumber: contactNumber || '',
      paymentDate: paymentDate || new Date().toISOString(),
      status: 'approved', // Auto-approve in local mode
      createdAt: new Date().toISOString()
    };
    
    console.log('Bank transfer details recorded (local mode):', bankTransfer);
    
    // Calculate premium duration based on plan
    let premiumDays = 30; // default for monthly
    if (planId === 'yearly') {
      premiumDays = 365;
    }
    
    // Calculate expiry date
    let expiryDate = new Date();
    if (user.isPremium && user.premiumExpiry && new Date(user.premiumExpiry) > new Date()) {
      // Extend current premium
      expiryDate = new Date(user.premiumExpiry);
      expiryDate.setDate(expiryDate.getDate() + premiumDays);
    } else {
      // New premium
      expiryDate.setDate(expiryDate.getDate() + premiumDays);
    }
    
    // Update user's premium status
    user.isPremium = true;
    user.premiumExpiry = expiryDate.toISOString();
    
    // Add payment history to user record if it exists
    if (!Array.isArray(user.paymentHistory)) {
      user.paymentHistory = [];
    }
    
    user.paymentHistory.push({
      planId,
      amount,
      method: 'bank_transfer',
      transactionId,
      status: 'approved',
      date: new Date().toISOString()
    });
    
    // Save updated user to local storage
    users[userIndex] = user;
    saveUsers(users);
    
    console.log('Premium access granted via bank transfer (local mode):');
    console.log('- User:', user.username);
    console.log('- Is Premium:', user.isPremium);
    console.log('- Expiry Date:', user.premiumExpiry);
    console.log('==== LOCAL BANK TRANSFER VERIFICATION END ====');
    
    return res.status(200).json({
      success: true,
      message: 'Bank transfer verification successful. Premium activated.',
      user: {
        id: user._id,
        isPremium: user.isPremium,
        premiumExpiry: user.premiumExpiry,
        daysRemaining: Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    console.error('Error verifying bank transfer (local mode):', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error verifying bank transfer', 
      error: error.message 
    });
  }
}; 