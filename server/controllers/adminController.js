const User = require('../models/User');
const Book = require('../models/Book');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort('-createdAt');
        
        // Format the response with premium status
        const formattedUsers = users.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
            premiumExpiry: user.premiumExpiry,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            profilePicture: user.profilePicture || ''
        }));
        
        res.json(formattedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('favoriteBooks', 'title author coverImage');
            
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Format response with additional info
        const userResponse = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium,
            premiumExpiry: user.premiumExpiry,
            favoriteBooks: user.favoriteBooks || [],
            readingHistory: user.readingHistory || [],
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            profilePicture: user.profilePicture || ''
        };
        
        res.json(userResponse);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
    try {
        const { username, email, role, isPremium, premiumExpiry } = req.body;
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update fields if provided
        if (username) user.username = username;
        if (email) user.email = email;
        if (role) user.role = role;
        if (isPremium !== undefined) user.isPremium = isPremium;
        if (premiumExpiry) user.premiumExpiry = new Date(premiumExpiry);
        
        await user.save();
        
        res.json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isPremium: user.isPremium,
                premiumExpiry: user.premiumExpiry
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Prevent deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin users' });
        }
        
        await User.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

// Get system stats (admin only)
exports.getSystemStats = async (req, res) => {
    try {
        // Get counts
        const totalUsers = await User.countDocuments();
        const totalBooks = await Book.countDocuments();
        const totalPremiumUsers = await User.countDocuments({ isPremium: true });
        
        // Get user roles breakdown
        const readerCount = await User.countDocuments({ role: 'reader' });
        const authorCount = await User.countDocuments({ role: 'author' });
        const adminCount = await User.countDocuments({ role: 'admin' });
        
        // Get book categories breakdown
        const categories = await Book.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Get recent users
        const recentUsers = await User.find()
            .select('username email role isPremium createdAt')
            .sort('-createdAt')
            .limit(5);
        
        // Get recent books
        const recentBooks = await Book.find()
            .select('title author category isPremium coverImage createdAt')
            .sort('-createdAt')
            .limit(5);

        // Assemble the response
        const stats = {
            users: {
                total: totalUsers,
                premium: totalPremiumUsers,
                roles: {
                    reader: readerCount,
                    author: authorCount,
                    admin: adminCount
                }
            },
            books: {
                total: totalBooks,
                categories: categories.map(c => ({ 
                    name: c._id, 
                    count: c.count 
                }))
            },
            recent: {
                users: recentUsers,
                books: recentBooks
            }
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({ message: 'Error fetching system stats', error: error.message });
    }
}; 