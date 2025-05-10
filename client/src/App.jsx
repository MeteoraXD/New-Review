import React, { useEffect, useState } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box } from '@mui/material';
import ErrorBoundary from './components/ErrorBoundary';

// Components
import AuthProvider, { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import BookList from './pages/BookList';
import BookDetail from './pages/BookDetail';
import AddBook from './pages/AddBook';
import BookManagement from './pages/BookManagement';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';
import AdminBookEdit from './pages/Admin/AdminBookEdit';
import setPdfWorker from './utils/pdfWorker';
import UserManagement from './pages/Admin/UserManagement';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminCreation from './pages/auth/AdminCreation';
import AdminBookList from './pages/Admin/AdminBookList';
import PremiumSubscription from './pages/PremiumSubscription';
import PaymentSuccess from './pages/PaymentSuccess';

// Admin Role Fixer utility component
const AdminRoleFixer = () => {
    const [status, setStatus] = useState('Checking localStorage...');
    const [fixed, setFixed] = useState(false);
    
    useEffect(() => {
        try {
            // Get current user data
            const userData = localStorage.getItem('user');
            if (!userData) {
                setStatus('No user found in localStorage. Please log in first.');
                return;
            }
            
            // Parse and check role
            const user = JSON.parse(userData);
            setStatus(`Current user: ${user.username || user.name || 'Unknown'}, role: ${user.role || 'none'}`);
            
            // Fix if not admin
            if (user.role !== 'admin') {
                const oldRole = user.role;
                user.role = 'admin';
                localStorage.setItem('user', JSON.stringify(user));
                setStatus(`Role fixed! Changed from "${oldRole}" to "admin". Please refresh the app.`);
                setFixed(true);
            } else {
                setStatus('User already has admin role. No changes needed.');
            }
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        }
    }, []);
    
    const styles = {
        container: {
            maxWidth: '500px',
            margin: '100px auto',
            padding: '20px',
            backgroundColor: '#f8f8f8',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        },
        heading: {
            color: '#1a237e',
            marginBottom: '20px',
            borderBottom: '1px solid #ddd',
            paddingBottom: '10px'
        },
        status: {
            padding: '15px',
            backgroundColor: fixed ? '#e8f5e9' : '#fff3e0',
            borderRadius: '4px',
            marginBottom: '20px',
            border: `1px solid ${fixed ? '#81c784' : '#ffe082'}`
        },
        button: {
            padding: '10px 15px',
            backgroundColor: '#1a237e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'block',
            width: '100%',
            marginTop: '20px'
        }
    };
    
    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>Admin Role Fixer Utility</h2>
            <div style={styles.status}>
                {status}
            </div>
            {fixed && (
                <button 
                    style={styles.button}
                    onClick={() => window.location.href = '/admin/dashboard'}
                >
                    Go to Admin Dashboard
                </button>
            )}
            <button 
                style={styles.button}
                onClick={() => window.location.href = '/'}
            >
                Back to Home
            </button>
        </div>
    );
};

// Create theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#1a237e', // Deep blue to match layout
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

// Premium Books Wrapper - redirects non-premium users
const PremiumBooksWrapper = () => {
    const { user, hasPremiumAccess } = useAuth();
    console.log('PremiumBooksWrapper - Initial Check');
    console.log('- User:', user);
    console.log('- User role:', user?.role);
    console.log('- Has premium access:', hasPremiumAccess?.());
    
    // Wait for auth to initialize
    if (!user) {
        console.log('No user, redirecting to login');
        return <Navigate to="/login?redirect=/premium-books" />;
    }
    
    // Redirect non-premium users to the premium subscription page
    if (user.role !== 'admin' && user.role !== 'author' && !hasPremiumAccess()) {
        console.log('User does not have premium access, redirecting to premium page');
        console.log('- Role:', user.role);
        console.log('- isPremium:', user.isPremium);
        console.log('- hasPremiumAccess():', hasPremiumAccess());
        return <Navigate to="/premium" />;
    }
    
    console.log('User has premium access, showing premium books');
    // User has premium access, show the premium books
    return <BookList premiumOnly={true} />;
};

function App() {
    console.log("Rendering App component");
    const [pdfWorkerReady, setPdfWorkerReady] = useState(false);

    // Set up PDF worker on component mount
    useEffect(() => {
        console.log("Setting up PDF.js worker...");
        try {
            setPdfWorker();
            setPdfWorkerReady(true);
            console.log("PDF.js worker setup complete");
        } catch (error) {
            console.error("Error setting up PDF.js worker:", error);
            // Still set ready to true to prevent app from not loading
            setPdfWorkerReady(true);
        }
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <div className="App">
                    <Navbar />
                    <Box sx={{ minHeight: 'calc(100vh - 64px)', paddingTop: 8, paddingBottom: 5 }}>
                        <ErrorBoundary showErrorDetails={true}>
                            <Routes>
                                {/* Public routes accessible to all users */}
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/admin-creation" element={<AdminCreation />} />
                                <Route path="/admin-fix" element={<AdminRoleFixer />} />
                                <Route path="/books" element={<BookList />} />
                                <Route path="/books/:id" element={<BookDetail />} />
                                
                                {/* Routes protected for logged-in users */}
                                <Route path="/profile" element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/dashboard" element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/settings" element={
                                    <ProtectedRoute>
                                        <Settings />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Premium Routes */}
                                <Route path="/premium" element={
                                    <ProtectedRoute>
                                        <PremiumSubscription />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Premium content routes - authors and admins can access */}
                                <Route path="/premium-books" element={
                                    <ProtectedRoute>
                                        <PremiumBooksWrapper />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Free Books Route - accessible to all */}
                                <Route path="/free-books" element={<BookList freeOnly={true} />} />
                                
                                {/* Author/Admin Protected Routes */}
                                <Route path="/books/add" element={
                                    <ProtectedRoute requiredRole="author">
                                        <AddBook />
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/manage-books" element={
                                    <ProtectedRoute requiredRole="author">
                                        <BookManagement />
                                    </ProtectedRoute>
                                } />
                                
                                {/* Admin Routes */}
                                <Route path="/admin/books/edit/:id" element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminBookEdit />
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/books/new" element={
                                    <ProtectedRoute requiredRole="admin">
                                        <AdminBookEdit />
                                    </ProtectedRoute>
                                } />

                                {/* Admin Dashboard and Layout */}
                                <Route 
                                    path="/admin"
                                    element={
                                        <ProtectedRoute requiredRole="admin">
                                            <AdminLayout />
                                        </ProtectedRoute>
                                    }
                                >
                                    <Route index element={<AdminDashboard />} />
                                    <Route path="dashboard" element={<AdminDashboard />} />
                                    <Route path="books" element={<AdminBookList />} />
                                    <Route path="books/add" element={<AdminBookEdit isNew={true} />} />
                                    <Route path="books/edit/:id" element={<AdminBookEdit />} />
                                    <Route path="users" element={<UserManagement />} />
                                    <Route path="profile" element={<Profile />} />
                                </Route>

                                <Route path="/payment-success" element={<PaymentSuccess />} />
                            </Routes>
                        </ErrorBoundary>
                    </Box>
                    <Footer />
                    <ToastContainer position="bottom-right" />
                </div>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App; 