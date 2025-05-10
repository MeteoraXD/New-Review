import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    AppBar, Box, Toolbar, IconButton, Typography, Menu, 
    Container, Avatar, Button, Tooltip, MenuItem, Drawer, 
    List, ListItem, ListItemText, ListItemButton, Divider,
    Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BookIcon from '@mui/icons-material/Book';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { toast } from 'react-toastify';
import StarIcon from '@mui/icons-material/Star';
import { Link } from 'react-router-dom';
import { ListItemIcon } from '@mui/material';

const Navbar = () => {
    const { user, logout, hasPremiumAccess } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [anchorElUser, setAnchorElUser] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        if (user) {
            console.log('Current user:', user);
            console.log('User role:', user.role);
            setUserRole(user.role);

            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (storedUser && storedUser.role && user.role !== storedUser.role) {
                console.log('Role mismatch detected, updating from localStorage');
                window.location.reload();
            }
        }
    }, [user]);

    const isAuthorOrAdmin = () => {
        if (!user) return false;
        return user.role === 'author' || user.role === 'admin';
    };

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleToggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleCloseMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/');
        handleCloseUserMenu();
    };

    const handleNavigation = (path) => {
        // Special handling for premium books
        if (path === '/premium-books' && user && !hasPremiumAccess() && 
            user.role !== 'admin' && user.role !== 'author') {
            // If user doesn't have premium access and isn't admin/author, 
            // redirect to premium upgrade page
            console.log('Premium access check:');
            console.log('- User:', user);
            console.log('- Role:', user.role);
            console.log('- Has premium:', hasPremiumAccess());
            console.log('- Is admin/author:', user.role === 'admin' || user.role === 'author');
            console.log('Redirecting to premium upgrade page instead of premium books');
            navigate('/premium');
        } else {
            // Normal navigation
            navigate(path);
        }
        handleCloseUserMenu();
        handleCloseMobileMenu();
    };

    return (
        <AppBar position="fixed">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    {/* Logo for desktop */}
                    <BookIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        BookSansar
                    </Typography>

                    {/* Mobile menu toggle */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleToggleMobileMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Drawer
                            anchor="left"
                            open={mobileMenuOpen}
                            onClose={handleCloseMobileMenu}
                        >
                            <Box
                                sx={{ width: 250 }}
                                role="presentation"
                            >
                                <List>
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={() => handleNavigation('/')}>
                                            <ListItemText primary="Home" />
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem disablePadding>
                                        <ListItemButton 
                                            onClick={() => handleNavigation('/books')}
                                            sx={{
                                                bgcolor: 'secondary.main',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: 'secondary.dark',
                                                }
                                            }}
                                        >
                                            <BookIcon sx={{ mr: 1 }} />
                                            <ListItemText primary="Browse Books" />
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem disablePadding>
                                        <ListItemButton 
                                            onClick={() => handleNavigation('/free-books')}
                                            sx={{
                                                bgcolor: 'success.main',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: 'success.dark',
                                                }
                                            }}
                                        >
                                            <BookIcon sx={{ mr: 1 }} />
                                            <ListItemText primary="Free Books" />
                                        </ListItemButton>
                                    </ListItem>
                                    
                                    {user && (
                                        <ListItem disablePadding>
                                            <ListItemButton 
                                                onClick={() => handleNavigation('/premium-books')}
                                                sx={{
                                                    textAlign: 'center',
                                                    color: 'secondary.main',
                                                    position: 'relative'
                                                }}
                                            >
                                                <ListItemIcon sx={{ color: 'secondary.main' }}>
                                                    <StarIcon />
                                                </ListItemIcon>
                                                <ListItemText primary="Premium Books" />
                                                {!user && (
                                                    <Chip
                                                        label="Login Required"
                                                        size="small"
                                                        color="warning"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 6,
                                                            right: 16,
                                                            transform: 'scale(0.7)',
                                                        }}
                                                    />
                                                )}
                                            </ListItemButton>
                                        </ListItem>
                                    )}
                                    
                                    {/* Add Upgrade to Premium button in mobile menu */}
                                    {user && (
                                        <ListItem disablePadding>
                                            <ListItemButton 
                                                component={Link}
                                                to="/premium"
                                                sx={{
                                                    bgcolor: user?.isPremium ? 'secondary.main' : 'warning.main',
                                                    color: 'white',
                                                    '&:hover': {
                                                        bgcolor: user?.isPremium ? 'secondary.dark' : 'warning.dark',
                                                    }
                                                }}
                                            >
                                                <ListItemIcon sx={{ color: 'white' }}>
                                                    <StarIcon />
                                                </ListItemIcon>
                                                <ListItemText primary={user?.isPremium ? "Manage Premium" : "Upgrade to Premium"} />
                                            </ListItemButton>
                                        </ListItem>
                                    )}
                                    
                                    {user ? (
                                        <>
                                            <Divider />
                                            <ListItem disablePadding>
                                                <ListItemButton onClick={() => handleNavigation('/dashboard')}>
                                                    <ListItemText primary="Dashboard" />
                                                </ListItemButton>
                                            </ListItem>
                                            <ListItem disablePadding>
                                                <ListItemButton onClick={() => handleNavigation('/profile')}>
                                                    <ListItemText primary="Profile" />
                                                </ListItemButton>
                                            </ListItem>
                                            {user.role === 'admin' && (
                                                <ListItem disablePadding>
                                                    <ListItemButton onClick={() => handleNavigation('/admin')}>
                                                        <ListItemText primary="Admin Panel" />
                                                    </ListItemButton>
                                                </ListItem>
                                            )}
                                            {(isAuthorOrAdmin()) && (
                                                <ListItem disablePadding>
                                                    <ListItemButton 
                                                        onClick={() => handleNavigation('/books/add')}
                                                        sx={{
                                                            bgcolor: 'secondary.main',
                                                            color: 'white',
                                                            '&:hover': {
                                                                bgcolor: 'secondary.dark',
                                                            }
                                                        }}
                                                    >
                                                        <AddCircleIcon sx={{ mr: 1 }} />
                                                        <ListItemText primary="Add Book" />
                                                    </ListItemButton>
                                                </ListItem>
                                            )}
                                            <ListItem disablePadding>
                                                <ListItemButton onClick={handleLogout}>
                                                    <ListItemText primary="Logout" />
                                                </ListItemButton>
                                            </ListItem>
                                        </>
                                    ) : (
                                        <>
                                            <Divider />
                                            <ListItem disablePadding>
                                                <ListItemButton onClick={() => handleNavigation('/login')}>
                                                    <ListItemText primary="Login" />
                                                </ListItemButton>
                                            </ListItem>
                                            <ListItem disablePadding>
                                                <ListItemButton onClick={() => handleNavigation('/register')}>
                                                    <ListItemText primary="Register" />
                                                </ListItemButton>
                                            </ListItem>
                                        </>
                                    )}
                                </List>
                            </Box>
                        </Drawer>
                    </Box>

                    {/* Logo for mobile */}
                    <BookIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
                    <Typography
                        variant="h5"
                        noWrap
                        component="a"
                        href="/"
                        sx={{
                            mr: 2,
                            display: { xs: 'flex', md: 'none' },
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        BookSansar
                    </Typography>

                    {/* Desktop navigation buttons */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                        <Button
                            onClick={() => handleNavigation('/')}
                            sx={{ my: 2, color: 'white', display: 'block' }}
                        >
                            Home
                        </Button>
                        <Button
                            onClick={() => handleNavigation('/books')}
                            variant="contained" 
                            color="secondary"
                            startIcon={<BookIcon />}
                            sx={{ 
                                my: 1, 
                                mx: 1,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                borderRadius: '20px',
                                px: 2,
                                boxShadow: 2,
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                    transition: 'transform 0.3s'
                                }
                            }}
                        >
                            Browse Books
                        </Button>
                        <Button
                            onClick={() => handleNavigation('/free-books')}
                            sx={{ 
                                my: 2, 
                                color: 'white', 
                                display: 'block',
                                '&:hover': {
                                    color: 'success.light'
                                }
                            }}
                        >
                            Free Books
                        </Button>
                        {user && (
                            <Button
                                color="secondary"
                                startIcon={<StarIcon />}
                                sx={{
                                    my: 1,
                                    mx: 1.5,
                                    display: { xs: 'none', md: 'flex' },
                                    position: 'relative'
                                }}
                                onClick={() => handleNavigation('/premium-books')}
                            >
                                Premium Books
                                {!user && (
                                    <Chip
                                        label="Login Required"
                                        size="small"
                                        color="warning"
                                        sx={{
                                            position: 'absolute',
                                            top: -8,
                                            right: -10,
                                            transform: 'scale(0.8)',
                                        }}
                                    />
                                )}
                            </Button>
                        )}
                        
                        {/* Upgrade to Premium button - desktop */}
                        {user && (
                            <Button
                                variant="contained"
                                color={user?.isPremium ? "secondary" : "warning"}
                                startIcon={<StarIcon />}
                                onClick={() => handleNavigation('/premium')}
                                sx={{ 
                                    my: 1, 
                                    mx: 1,
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    borderRadius: '20px',
                                    px: 2,
                                    boxShadow: 2,
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        transition: 'transform 0.3s'
                                    }
                                }}
                            >
                                {user?.isPremium ? "Manage Premium" : "Upgrade to Premium"}
                            </Button>
                        )}
                        
                        {isAuthorOrAdmin() && (
                            <Button
                                onClick={() => handleNavigation('/books/add')}
                                variant="contained" 
                                color="secondary"
                                startIcon={<AddCircleIcon />}
                                sx={{ 
                                    my: 1, 
                                    mx: 1,
                                    fontWeight: 'bold',
                                    textTransform: 'none',
                                    borderRadius: '20px',
                                    px: 2,
                                    boxShadow: 2,
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        transition: 'transform 0.3s'
                                    }
                                }}
                            >
                                Add Book
                            </Button>
                        )}
                        {user && (
                            <Chip 
                                label={`Role: ${user.role || 'unknown'}`}
                                color={user.role === 'author' ? 'secondary' : 'primary'}
                                size="small"
                                sx={{ 
                                    my: 2,
                                    ml: 2,
                                    display: { xs: 'none', md: 'flex' }
                                }}
                            />
                        )}
                    </Box>

                    {/* User menu - Only show when authenticated */}
                    {user ? (
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="Open settings">
                                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                    {user.profilePicture ? (
                                        <Avatar alt={user.name} src={user.profilePicture} />
                                    ) : (
                                        <Avatar alt={user.name}>
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </Avatar>
                                    )}
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: '45px' }}
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                <MenuItem onClick={() => handleNavigation('/profile')}>
                                    <AccountCircleIcon sx={{ marginRight: 1 }} /> Profile
                                </MenuItem>
                                <MenuItem onClick={() => handleNavigation('/dashboard')}>
                                    <DashboardIcon sx={{ marginRight: 1 }} /> Dashboard
                                </MenuItem>
                                {user && user.role === 'admin' && (
                                    <MenuItem onClick={() => handleNavigation('/admin')}>
                                        <AdminPanelSettingsIcon sx={{ marginRight: 1 }} /> Admin Panel
                                    </MenuItem>
                                )}
                                <MenuItem onClick={() => handleNavigation('/premium')}>
                                    <StarIcon sx={{ marginRight: 1, color: 'secondary.main' }} /> 
                                    {user?.isPremium ? "Manage Premium" : "Upgrade to Premium"}
                                </MenuItem>
                                <MenuItem onClick={() => handleNavigation('/manage-books')}>
                                    <BookIcon sx={{ marginRight: 1 }} /> My Books
                                </MenuItem>
                                <MenuItem onClick={() => handleNavigation('/settings')}>
                                    <SettingsIcon sx={{ marginRight: 1 }} /> Settings
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <LogoutIcon sx={{ marginRight: 1 }} /> Logout
                                </MenuItem>
                            </Menu>
                        </Box>
                    ) : (
                        /* Login/Register buttons - Only show when not authenticated */
                        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                            <Button
                                onClick={() => handleNavigation('/login')}
                                sx={{ my: 2, color: 'white', display: 'block' }}
                            >
                                Login
                            </Button>
                            <Button
                                onClick={() => handleNavigation('/register')}
                                sx={{ my: 2, color: 'white', display: 'block' }}
                            >
                                Register
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar; 