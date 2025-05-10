import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
} from '@mui/material';
import { 
  Book as BookIcon,
  LibraryBooks as LibraryIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  SupervisorAccount as AdminIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const authenticated = !!user;

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  const handleMenuItemClick = (path) => {
    handleCloseUserMenu();
    navigate(path);
  };

  // Define navigation items
  const getNavigationItems = () => {
    const items = [
      { text: 'Browse Books', path: '/books', icon: <LibraryIcon /> }
    ];

    if (authenticated) {
      if (user?.role === 'admin') {
        items.push(
          { text: 'Admin', path: '/admin', icon: <AdminIcon /> },
          { text: 'Add Book', path: '/books/add', icon: <AddIcon /> }
        );
      } else if (user?.role === 'author') {
        items.push(
          { text: 'Add Book', path: '/books/add', icon: <AddIcon /> },
          { text: 'Manage Books', path: '/manage-books', icon: <LibraryIcon /> }
        );
      }
    }

    return items;
  };

  const renderAuthButtons = () => {
    if (authenticated) {
      return (
        <>
          <Button
            color="inherit"
            component={Link}
            to="/profile"
            startIcon={<PersonIcon />}
            sx={{ mr: 1, display: { xs: 'none', md: 'flex' } }}
          >
            Profile
          </Button>
          <Button 
            color="inherit" 
            onClick={handleLogout}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            Logout
          </Button>
          
          {/* User avatar and menu for smaller screens */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user?.name} src={user?.avatar} />
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
              <MenuItem onClick={() => handleMenuItemClick('/profile')}>
                <Typography textAlign="center">Profile</Typography>
              </MenuItem>
              <MenuItem onClick={() => handleMenuItemClick('/settings')}>
                <Typography textAlign="center">Settings</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </>
      );
    } else {
      return (
        <>
          <Button 
            color="inherit" 
            component={Link} 
            to="/login"
            sx={{ mr: 1 }}
          >
            Login
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            component={Link} 
            to="/register"
          >
            Register
          </Button>
        </>
      );
    }
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo - desktop */}
          <BookIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            BookSansar
          </Typography>

          {/* Mobile menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              <MenuItem 
                onClick={() => {
                  handleCloseNavMenu();
                  navigate('/books');
                }}
                sx={{
                  backgroundColor: 'secondary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'secondary.dark',
                  },
                  mb: 1
                }}
              >
                <LibraryIcon sx={{ mr: 1 }} />
                <Typography textAlign="center">Browse Books</Typography>
              </MenuItem>
              
              {getNavigationItems().map((item) => (
                <MenuItem key={item.text} onClick={() => {
                  handleCloseNavMenu();
                  navigate(item.path);
                }}>
                  <Typography textAlign="center">{item.text}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Logo - mobile */}
          <BookIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            BookSansar
          </Typography>

          {/* Desktop menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button
              component={Link}
              to="/books"
              variant="contained"
              color="secondary"
              startIcon={<LibraryIcon />}
              sx={{ 
                my: 2, 
                mr: 2, 
                fontWeight: 'bold',
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
            {getNavigationItems().map((item) => (
              <Button
                key={item.text}
                component={Link}
                to={item.path}
                onClick={handleCloseNavMenu}
                startIcon={item.icon}
                sx={{ my: 2, color: 'white', display: 'flex' }}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          {/* Auth buttons */}
          <Box sx={{ flexGrow: 0 }}>
            {renderAuthButtons()}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 