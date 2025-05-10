const fs = require('fs');
const path = require('path');

// Directory to store user data
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('Created data directory');
}

// Default admin user
const adminUser = {
  _id: 'admin123',
  username: 'Administrator',
  email: 'admin@booksansar.com',
  password: 'admin123', // In a real app, this would be hashed
  role: 'admin',
  isPremium: true,
  hasPremiumAccess: true,
  lastLogin: new Date().toISOString()
};

// Function to save users
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Main function
async function setupAdmin() {
  console.log('Setting up admin user...');
  
  let users = [];
  // Check if users file exists
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
      console.log(`Found ${users.length} existing users`);
    } catch (err) {
      console.error('Error reading users file:', err);
      // Create new file if error
      saveUsers([]);
      users = [];
    }
  }
  
  // Check if admin already exists
  const existingAdmin = users.find(user => user.email === adminUser.email);
  
  if (existingAdmin) {
    console.log('Admin user already exists. Credentials:');
    console.log('Email:', existingAdmin.email);
    console.log('Password: admin123');
    console.log('User ID:', existingAdmin._id);
    console.log('Role:', existingAdmin.role);
  } else {
    // Add admin user
    users.push(adminUser);
    saveUsers(users);
    
    console.log('Admin user created successfully:');
    console.log('Email:', adminUser.email);
    console.log('Password: admin123');
    console.log('User ID:', adminUser._id);
  }
  
  // Also create a custom admin user if specified
  if (process.argv.length >= 4) {
    const customEmail = process.argv[2];
    const customPassword = process.argv[3];
    
    const existingCustomAdmin = users.find(user => user.email === customEmail);
    
    if (existingCustomAdmin) {
      console.log(`\nCustom admin with email ${customEmail} already exists.`);
      console.log('User ID:', existingCustomAdmin._id);
      console.log('Role:', existingCustomAdmin.role);
    } else {
      const customAdminUser = {
        _id: `admin_${Date.now()}`,
        username: 'Custom Admin',
        email: customEmail,
        password: customPassword, // In a real app, this would be hashed
        role: 'admin',
        isPremium: true,
        hasPremiumAccess: true,
        lastLogin: new Date().toISOString()
      };
      
      users.push(customAdminUser);
      saveUsers(users);
      
      console.log(`\nCustom admin user created successfully:`);
      console.log('Email:', customEmail);
      console.log('Password:', customPassword);
      console.log('User ID:', customAdminUser._id);
    }
  }
  
  console.log('\nAdmin setup complete!');
  console.log('You can now use these credentials to log in through the application.');
}

// Run the setup
setupAdmin().catch(err => {
  console.error('Error during admin setup:', err);
}); 