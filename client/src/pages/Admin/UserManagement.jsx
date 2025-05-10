import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  TextField,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Mock data - replace with API call
const MOCK_USERS = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active', registeredDate: '2023-01-15', lastLogin: '2023-06-10' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin', status: 'active', registeredDate: '2023-02-20', lastLogin: '2023-06-12' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'author', status: 'inactive', registeredDate: '2023-03-05', lastLogin: '2023-05-30' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'user', status: 'active', registeredDate: '2023-04-10', lastLogin: '2023-06-11' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'user', status: 'blocked', registeredDate: '2023-01-25', lastLogin: '2023-04-20' },
  { id: 6, name: 'Diana Miller', email: 'diana@example.com', role: 'author', status: 'active', registeredDate: '2023-05-12', lastLogin: '2023-06-09' },
  { id: 7, name: 'Edward Davis', email: 'edward@example.com', role: 'user', status: 'active', registeredDate: '2023-03-18', lastLogin: '2023-06-08' },
  { id: 8, name: 'Fiona Clark', email: 'fiona@example.com', role: 'user', status: 'inactive', registeredDate: '2023-02-09', lastLogin: '2023-05-15' },
  { id: 9, name: 'George White', email: 'george@example.com', role: 'user', status: 'active', registeredDate: '2023-04-22', lastLogin: '2023-06-07' },
  { id: 10, name: 'Hannah Green', email: 'hannah@example.com', role: 'author', status: 'active', registeredDate: '2023-05-30', lastLogin: '2023-06-13' },
  { id: 11, name: 'Ian Black', email: 'ian@example.com', role: 'user', status: 'blocked', registeredDate: '2023-01-05', lastLogin: '2023-03-10' },
  { id: 12, name: 'Julia Reed', email: 'julia@example.com', role: 'user', status: 'active', registeredDate: '2023-03-28', lastLogin: '2023-06-05' },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  // Fetch users - mock API call
  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      setUsers(MOCK_USERS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle role filter change
  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  // Handle user deletion
  const handleDeleteConfirm = () => {
    // Delete user - replace with actual API call
    const updatedUsers = users.filter(user => user.id !== selectedUser.id);
    setUsers(updatedUsers);
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    // Show success message or notification
  };

  // Open block/unblock confirmation dialog
  const handleBlockClick = (user) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  // Close block/unblock confirmation dialog
  const handleBlockClose = () => {
    setBlockDialogOpen(false);
    setSelectedUser(null);
  };

  // Handle user block/unblock
  const handleBlockConfirm = () => {
    // Update user status - replace with actual API call
    const updatedUsers = users.map(user => {
      if (user.id === selectedUser.id) {
        return {
          ...user,
          status: user.status === 'active' ? 'blocked' : 'active'
        };
      }
      return user;
    });
    setUsers(updatedUsers);
    setBlockDialogOpen(false);
    setSelectedUser(null);
    // Show success message or notification
  };

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get users for current page
  const displayedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      {/* Filters and Search */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Search Users"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ minWidth: 250 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={handleRoleFilterChange}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="author">Author</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="blocked">Blocked</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          component={Link}
          to="/admin/users/add"
          sx={{ ml: 'auto' }}
        >
          Add New User
        </Button>
      </Box>
      
      {/* Users Table */}
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Loading users...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      No users found matching the current filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                        size="small"
                        color={user.role === 'admin' ? 'primary' : 'default'}
                        variant={user.role === 'admin' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.status.charAt(0).toUpperCase() + user.status.slice(1)} 
                        size="small"
                        color={getStatusColor(user.status)}
                      />
                    </TableCell>
                    <TableCell>{user.registeredDate}</TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Edit User">
                          <IconButton 
                            component={Link} 
                            to={`/admin/users/edit/${user.id}`}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={user.status === 'blocked' ? 'Unblock User' : 'Block User'}>
                          <IconButton 
                            size="small" 
                            color={user.status === 'blocked' ? 'success' : 'warning'}
                            onClick={() => handleBlockClick(user)}
                          >
                            {user.status === 'blocked' ? 
                              <CheckCircleIcon fontSize="small" /> : 
                              <BlockIcon fontSize="small" />
                            }
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete User">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteClose}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user "{selectedUser?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Block/Unblock Confirmation Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={handleBlockClose}
      >
        <DialogTitle>
          {selectedUser?.status === 'blocked' ? 'Unblock User' : 'Block User'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser?.status === 'blocked'
              ? `Are you sure you want to unblock user "${selectedUser?.name}"?`
              : `Are you sure you want to block user "${selectedUser?.name}"? They will not be able to access their account.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBlockClose}>Cancel</Button>
          <Button 
            onClick={handleBlockConfirm} 
            color={selectedUser?.status === 'blocked' ? 'success' : 'warning'} 
            variant="contained"
          >
            {selectedUser?.status === 'blocked' ? 'Unblock' : 'Block'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 