import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Divider,
  IconButton,
  Typography,
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  MenuBook as MenuBookIcon,
  Add as AddIcon,
  Edit as EditIcon,
  SupervisorAccount,
  Book as BookIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
    roles: ['reader', 'author', 'admin']
  },
  {
    text: 'Browse Books',
    icon: <MenuBookIcon />,
    path: '/books',
    roles: ['reader', 'author', 'admin']
  },
  {
    text: 'Add Book',
    icon: <AddIcon />,
    path: '/add-book',
    roles: ['reader', 'author', 'admin']
  },
  {
    text: 'Manage Books',
    icon: <EditIcon />,
    path: '/manage-books',
    roles: ['reader', 'author', 'admin']
  },
  {
    text: 'Admin Dashboard',
    icon: <SupervisorAccount />,
    path: '/admin',
    roles: ['admin']
  },
  {
    text: 'Profile',
    icon: <PersonIcon />,
    path: '/profile',
    roles: ['reader', 'author', 'admin']
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    roles: ['reader', 'author', 'admin']
  }
];

const Sidebar = ({ user, mobileOpen, onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    if (mobileOpen) {
      onMenuClick();
    }
  };

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMenuClick}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: '#1a237e', mr: 1 }}>
              <BookIcon />
            </Avatar>
            <Typography variant="h6" noWrap component="div" sx={{ 
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: '#1a237e'
            }}>
              BookSansar
            </Typography>
          </Box>
          <IconButton onClick={onMenuClick}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        <Divider />
        {renderMenu(authUser)}
        <Divider />
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Typography variant="body2" noWrap>
            {user?.name}
          </Typography>
          <Typography variant="caption" noWrap>
            {user?.email}
          </Typography>
        </Box>
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: '#1a237e', mr: 1 }}>
              <BookIcon />
            </Avatar>
            <Typography variant="h6" noWrap component="div" sx={{ 
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: '#1a237e'
            }}>
              BookSansar
            </Typography>
          </Box>
        </Box>
        <Divider />
        {renderMenu(authUser)}
        <Divider />
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ mr: 2 }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="body2" noWrap>
                {user?.name}
              </Typography>
              <Typography variant="caption" noWrap>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );

  function renderMenu(authUser) {
    return (
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {menuItems
            .filter(item => !item.roles || item.roles.includes(authUser?.role))
            .map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: 48,
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: 3,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
        </List>
      </Box>
    );
  }
};

export default Sidebar; 