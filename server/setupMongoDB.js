const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const connectToMongoDB = require('./connectdb');

// Load environment variables
dotenv.config();

// Function to create admin user
async function createAdminUser() {
  try {
    // First test MongoDB connection
    const isConnected = await connectToMongoDB();
    
    if (!isConnected) {
      console.error('Cannot create admin user: MongoDB connection failed');
      return false;
    }
    
    // Connect to MongoDB for actual operations
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Load User model
    const User = require('./models/User');
    
    // Check if admin already exists
    const adminEmail = 'admin@booksansar.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Credentials:');
      console.log('Email:', adminEmail);
      console.log('Password: admin123');
      console.log('User ID:', existingAdmin._id);
      console.log('Role:', existingAdmin.role);
    } else {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new User({
        username: 'Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isPremium: true,
        lastLogin: new Date()
      });
      
      await adminUser.save();
      console.log('Admin user created successfully:');
      console.log('Email:', adminEmail);
      console.log('Password: admin123');
      console.log('User ID:', adminUser._id);
    }
    
    // Also create a custom admin user if specified
    if (process.argv.length >= 4) {
      const customEmail = process.argv[2];
      const customPassword = process.argv[3];
      
      const existingCustomAdmin = await User.findOne({ email: customEmail });
      
      if (existingCustomAdmin) {
        console.log(`\nCustom admin with email ${customEmail} already exists.`);
        console.log('User ID:', existingCustomAdmin._id);
        console.log('Role:', existingCustomAdmin.role);
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedCustomPassword = await bcrypt.hash(customPassword, salt);
        
        const customAdminUser = new User({
          username: 'Custom Admin',
          email: customEmail,
          password: hashedCustomPassword,
          role: 'admin',
          isPremium: true,
          lastLogin: new Date()
        });
        
        await customAdminUser.save();
        console.log(`\nCustom admin user created successfully:`);
        console.log('Email:', customEmail);
        console.log('Password:', customPassword);
        console.log('User ID:', customAdminUser._id);
      }
    }

    // Create a backup of admin user in local storage
    // This helps with fallback authentication if MongoDB goes down
    const DATA_DIR = path.join(__dirname, 'data');
    const USERS_FILE = path.join(DATA_DIR, 'users.json');
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log('Created data directory for backup');
    }
    
    // Get existing users or create empty array
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      try {
        users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      } catch (err) {
        console.error('Error reading users file:', err);
      }
    }
    
    // Check if admin already exists in local storage
    const localAdminExists = users.some(user => user.email === adminEmail);
    
    if (!localAdminExists) {
      // Add admin to local storage
      users.push({
        _id: 'admin123',
        username: 'Administrator',
        email: adminEmail,
        password: 'admin123', // Local storage version uses plain text for simplicity
        role: 'admin',
        isPremium: true,
        hasPremiumAccess: true,
        lastLogin: new Date().toISOString()
      });
      
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      console.log('Admin user also saved to local storage for backup');
    }
    
    console.log('\nAdmin setup complete!');
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  } finally {
    // Disconnect from MongoDB
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    } catch (err) {
      console.error('Error disconnecting from MongoDB:', err);
    }
  }
}

// Run if directly executed
if (require.main === module) {
  createAdminUser().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = createAdminUser; 