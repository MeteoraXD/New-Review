const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const createAdminUser = require('./server/setupMongoDB');
const connectToMongoDB = require('./server/connectdb');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility function to format console log with colors
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Function to check if MongoDB is accessible and create admin user if needed
async function setupMongoDB() {
  log('Checking MongoDB connection...', 'cyan');
  const isConnected = await connectToMongoDB();
  
  if (isConnected) {
    log('MongoDB connection successful!', 'green');
    log('Setting up admin user...', 'cyan');
    
    // Create admin user
    const adminCreated = await createAdminUser();
    if (adminCreated) {
      log('Admin user setup successful!', 'green');
      return true;
    } else {
      log('Admin user setup failed, but MongoDB connection works.', 'yellow');
      log('Will try to continue anyway...', 'yellow');
      return true;
    }
  } else {
    log('MongoDB connection failed!', 'red');
    log('Will start with local JSON storage instead.', 'yellow');
    return false;
  }
}

// Function to start the server
function startServer(useLocalStorage = false) {
  const serverPath = useLocalStorage 
    ? path.join(__dirname, 'server', 'localServer.js')
    : path.join(__dirname, 'server', 'server.js');
  
  log(`Starting ${useLocalStorage ? 'local storage' : 'MongoDB'} server...`, 'cyan');
  
  // Check if the server file exists
  if (!fs.existsSync(serverPath)) {
    log(`Server file not found: ${serverPath}`, 'red');
    return;
  }
  
  // Start the server process
  const serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit', // This will show the server output in the current console
    shell: true
  });
  
  // Handle server process events
  serverProcess.on('error', (error) => {
    log(`Failed to start server: ${error.message}`, 'red');
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      log(`Server process exited with code ${code}`, 'red');
    } else {
      log('Server process closed', 'yellow');
    }
  });
  
  // Handle process termination to clean up the server
  process.on('SIGINT', () => {
    log('Received SIGINT. Stopping server...', 'yellow');
    serverProcess.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Received SIGTERM. Stopping server...', 'yellow');
    serverProcess.kill();
    process.exit(0);
  });
}

// Main function
async function main() {
  log('=== BookSansar Server Startup ===', 'bright');
  log('Admin credentials:', 'yellow');
  log('Email: admin@booksansar.com');
  log('Password: admin123');
  log('=================================', 'bright');
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const forceLocal = args.includes('--local');
  
  if (forceLocal) {
    log('Forced local storage mode from command line arguments', 'yellow');
    startServer(true);
  } else {
    // Try MongoDB first
    const mongodbWorks = await setupMongoDB();
    startServer(!mongodbWorks); // If MongoDB fails, use local storage
  }
}

// Start the application
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'red');
  log('Stack trace:', 'red');
  console.error(error);
  process.exit(1);
}); 