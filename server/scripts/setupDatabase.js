require('dotenv').config({ path: '../.env' });
const { setupDatabase } = require('../config/database');
const migrateData = require('../config/migrateData');

const runSetup = async () => {
    try {
        console.log('Starting database setup...');
        await setupDatabase();
        console.log('Database setup completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
};

runSetup(); 