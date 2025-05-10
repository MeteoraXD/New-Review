import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';

const AuthLayout = () => {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <CssBaseline />
      <Navbar
        isAuthenticated={!!user}
        user={user}
        onLogout={logout}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: 'calc(100vh - 64px)',
          mt: '64px',
          bgcolor: 'background.default'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AuthLayout; 