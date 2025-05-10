const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booksansar', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
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
  } catch (error) {
    console.error('Error creating admin users:', error);
  } finally {
    // Disconnect from database
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
}); 