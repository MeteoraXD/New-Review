import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to ensure user object always has a properly set role
    const validateUserRole = (userData) => {
        if (!userData) return null;
        
        // Ensure role is properly set
        if (!userData.role) {
            console.warn('User object missing role, setting default to reader');
            userData.role = 'reader';
        }
        
        // Log for debugging
        console.log('Validated user role:', userData.role);
        return userData;
    };

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            const parsedUser = JSON.parse(userData);
            setUser(validateUserRole(parsedUser));
            console.log('User loaded from localStorage:', parsedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Ensure user has a valid role
            data.user = validateUserRole(data.user);
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('Registration failed:', data.message || 'Unknown error');
                throw new Error(data.message || 'Registration failed');
            }
            
            // Ensure user has a valid role 
            data.user = validateUserRole(data.user);
            
            // Double-check the role is set correctly
            if (data.user.role !== userData.role) {
                console.warn(`Role mismatch: requested ${userData.role} but received ${data.user.role}`);
                data.user.role = userData.role; // Force the requested role
            }
            
            // Automatically login after successful registration
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return data;
        } catch (error) {
            console.error('Registration error caught:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = () => {
        return user && user.role === 'admin';
    };

    const isAuthor = () => {
        return user && user.role === 'author';
    };

    const isReader = () => {
        return user && user.role === 'reader';
    };

    // Function to update user role
    const updateUserRole = (newRole) => {
        if (!user) return;
        
        const updatedUser = {...user, role: newRole};
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        console.log('User role updated to:', newRole);
    };
    
    // Function to update user data (for premium status, etc.)
    const updateUserData = (newData) => {
        if (!user) return;
        
        // Merge current user data with the new data
        const updatedUser = {...user, ...newData};
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        console.log('User data updated:', newData);
    };

    // Function to update profile information
    const updateProfile = (profileData) => {
        if (!user) return;
        
        // Update the user object with new profile data
        const updatedUser = {
            ...user,
            name: profileData.name || user.name,
            email: profileData.email || user.email,
            avatar: profileData.avatar || user.avatar
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        console.log('Profile updated:', profileData);
    };

    // Function to check if user has premium access
    const hasPremiumAccess = () => {
        if (!user) return false;
        
        // First check if isPremium is set
        if (!user.isPremium) return false;
        
        // If premium but no expiry date (unlimited premium)
        if (!user.premiumExpiry) return true;
        
        // Check if premium subscription is still valid
        return new Date() < new Date(user.premiumExpiry);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register,
        isAdmin,
        isAuthor,
        isReader,
        updateUserRole,
        updateUserData,
        updateProfile,
        hasPremiumAccess
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthProvider; 