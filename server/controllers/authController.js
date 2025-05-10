const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Format user response data
const formatUserResponse = (user) => {
    try {
        if (!user) {
            console.error('formatUserResponse called with null or undefined user');
            return null;
        }
        
        // Safely check premium status
        let isPremium = false;
        try {
            if (typeof user.hasPremiumAccess === 'function') {
                isPremium = user.hasPremiumAccess();
            } else {
                isPremium = user.isPremium || false;
            }
        } catch (premiumError) {
            console.error('Error checking premium status:', premiumError);
            isPremium = user.isPremium || false;
        }
        
        return {
            id: user._id ? user._id.toString() : '',
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
            id: user && user._id ? user._id.toString() : '',
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

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Prevent creating admin accounts through regular registration
        let userRole = role || 'reader';
        if (role === 'admin') {
            // Force role to be reader if someone tries to register as admin
            userRole = 'reader';
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            username,
            email,
            password: hashedPassword,
            role: userRole,
            isPremium: false,
            lastLogin: new Date()
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        console.log('Looking for user with email:', email);
        
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found with email:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        console.log('User found, checking password');

        // Check password
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.log('Password does not match');
                return res.status(400).json({ message: 'Invalid credentials' });
            }
        } catch (bcryptError) {
            console.error('Error comparing passwords:', bcryptError);
            return res.status(500).json({ message: 'Error checking password', error: bcryptError.message });
        }

        console.log('Password correct, updating last login time');
        
        // Update last login time
        try {
            user.lastLogin = new Date();
            await user.save();
        } catch (saveError) {
            console.error('Error updating last login time:', saveError);
            // Continue even if this fails, not critical
        }

        console.log('Creating JWT token');
        
        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '24h' }
        );

        console.log('Formatting user response');
        
        // Format user response safely
        let userResponse;
        try {
            userResponse = formatUserResponse(user);
        } catch (formatError) {
            console.error('Error formatting user response:', formatError);
            userResponse = {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isPremium: user.isPremium || false
            };
        }

        console.log('Login successful for user:', email);
        
        res.json({
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('favoriteBooks', 'title author coverImage');
            
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
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (username) user.username = username;
        if (email) user.email = email;
        if (profilePicture) user.profilePicture = profilePicture;

        await user.save();
        res.json({ 
            message: 'Profile updated successfully', 
            user: formatUserResponse(user)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
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
        
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin user
        user = new User({
            username,
            email,
            password: hashedPassword,
            role: 'admin',
            isPremium: true, // Admins get premium by default
            lastLogin: new Date()
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({ message: 'Error creating admin user', error: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        user.password = hashedPassword;
        await user.save();
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

// Check if token is valid
exports.checkToken = async (req, res) => {
    try {
        // Since the auth middleware already verified the token,
        // we just need to return the user data
        const user = await User.findById(req.user.id).select('-password');
            
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Token is valid',
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error('Token check error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error checking token', 
            error: error.message 
        });
    }
};

// Refresh token with updated user data
exports.refreshToken = async (req, res) => {
    try {
        // Get fresh user data from database
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        // Create a new token with the updated user information
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.role,
                isPremium: user.isPremium || false
            },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '7d' }
        );
        
        // Return the new token and user data
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