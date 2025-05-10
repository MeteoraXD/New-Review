const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Directory and file paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('Created data directory');
  // Create empty users file
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
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

// Format user response data
const formatUserResponse = (user) => {
  try {
    if (!user) {
      console.error('formatUserResponse called with null or undefined user');
      return null;
    }
    
    // Safely check premium status
    let isPremium = user.isPremium || false;
    
    return {
      id: user._id || '',
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'reader',
      isPremium: isPremium,
      profilePicture: user.profilePicture || '',
      createdAt: user.createdAt || new Date()
    };
  } catch (error) {
    console.error('Error in formatUserResponse:', error);
    // Return minimal user data to prevent complete failure
    return {
      id: user && user._id ? user._id : '',
      username: user && user.username ? user.username : '',
      email: user && user.email ? user.email : '',
      role: user && user.role ? user.role : 'reader'
    };
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Get current users
    const users = getUsers();

    // Check if user already exists
    const userExists = users.find(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Prevent creating admin accounts through regular registration
    let userRole = role || 'reader';
    if (role === 'admin') {
      // Force role to be reader if someone tries to register as admin
      userRole = 'reader';
    }

    // Create a new user object
    const newUser = {
      _id: `user_${Date.now()}`,
      username,
      email,
      password, // In a real app, this would be hashed
      role: userRole,
      isPremium: false,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Add to users array and save
    users.push(newUser);
    saveUsers(users);

    // Create token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: formatUserResponse(newUser)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user with automatic fallback to local storage
exports.login = async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Handle special admin case
    if (email === 'admin@booksansar.com' && password === 'admin123') {
      console.log('Admin login detected');
      
      // Check local storage first
      const users = getUsers();
      let adminUser = users.find(u => u.email === email);
      
      // If admin not found in local storage, create it
      if (!adminUser) {
        adminUser = {
          _id: 'admin123',
          username: 'Administrator',
          email: 'admin@booksansar.com',
          password: 'admin123', 
          role: 'admin',
          isPremium: true,
          hasPremiumAccess: true,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        users.push(adminUser);
        saveUsers(users);
        console.log('Admin user created in local storage');
      }
      
      // Create token
      const token = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '24h' }
      );
      
      console.log('Admin login successful');
      
      return res.json({
        token,
        user: formatUserResponse(adminUser)
      });
    }

    console.log('Looking for user with email:', email);
    
    // Get users and find matching email
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found, checking password');

    // For simplicity in this demo, just check direct password match
    // In a real app, you would use bcrypt.compare
    if (user.password !== password) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Password correct, updating last login time');
    
    // Update last login time
    user.lastLogin = new Date().toISOString();
    saveUsers(users);

    console.log('Creating JWT token');
    
    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', email);
    
    res.json({
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    // Get users
    const users = getUsers();
    const user = users.find(u => u._id === req.user.userId);
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, profilePicture } = req.body;
    
    // Get users
    const users = getUsers();
    const userIndex = users.findIndex(u => u._id === req.user.userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[userIndex];

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (profilePicture) user.profilePicture = profilePicture;

    // Save changes
    saveUsers(users);
    
    res.json({ 
      message: 'Profile updated successfully', 
      user: formatUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Refresh token with updated user data
exports.refreshToken = async (req, res) => {
  try {
    // Get users from local storage
    const users = getUsers();
    const user = users.find(u => u._id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Create new token with updated user info
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        isPremium: user.isPremium || false
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  // Since we're using JWT, we don't need to do anything server-side
  res.json({ message: 'Logged out successfully' });
};

// Create admin user (protected by admin secret key)
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password, adminSecret } = req.body;
    
    // Check if the admin secret is correct
    const correctAdminSecret = process.env.ADMIN_SECRET || 'sujan123_admin_secret';
    
    if (adminSecret !== correctAdminSecret) {
      return res.status(403).json({ message: 'Invalid admin secret key' });
    }
    
    // Get users
    const users = getUsers();
    
    // Check if user already exists
    const userExists = users.find(u => u.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new admin user
    const adminUser = {
      _id: `admin_${Date.now()}`,
      username,
      email,
      password, // In a real app, this would be hashed
      role: 'admin',
      isPremium: true,
      hasPremiumAccess: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Add to users array and save
    users.push(adminUser);
    saveUsers(users);

    res.status(201).json({ 
      message: 'Admin user created successfully',
      user: formatUserResponse(adminUser)
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
}; 