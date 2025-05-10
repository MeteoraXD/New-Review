import axios from 'axios';
import { API_URL } from '../config/config';

// Determine if we're in development or production
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

// Get the current origin for relative URLs
const currentOrigin = window.location.origin;
console.log('Current origin:', currentOrigin);
console.log('API URL:', API_URL);

// Create a custom axios instance with default configs
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Log configuration for debugging
console.log('Axios configured with baseURL:', API_URL);

// Add a request interceptor to include the authentication token
instance.interceptors.request.use(
  (config) => { 
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for improved error handling
instance.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      response: error.response?.data
    });
    
    // Create a friendly error message
    let friendlyMessage = 'An error occurred while communicating with the server.';
    
    if (!navigator.onLine) {
      friendlyMessage = 'You appear to be offline. Please check your internet connection.';
    } else if (error.code === 'ERR_NAME_NOT_RESOLVED' || error.code === 'ERR_NETWORK') {
      friendlyMessage = 'Cannot connect to the server. The service may be unavailable.';
    } else if (error.response) {
      switch (error.response.status) {
        case 401:
          friendlyMessage = 'Your session has expired. Please log in again.';
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          friendlyMessage = 'You do not have permission to access this resource.';
          break;
        case 404:
          friendlyMessage = 'The requested resource was not found.';
          break;
        case 500:
          friendlyMessage = 'The server encountered an error. Please try again later.';
          break;
        default:
          friendlyMessage = `Server error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`;
      }
    }
    
    // Add friendly message to error object
    error.friendlyMessage = friendlyMessage;
    
    return Promise.reject(error);
  }
);

export default instance; 