/**
 * Application Configuration
 * 
 * This file contains configuration settings for the BookSansar application.
 */

// Base URL for API calls
// In development, this is proxied to http://localhost:5000 via package.json proxy
export const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000';
  
// Default timeout for API requests (in milliseconds)
export const API_TIMEOUT = 30000;

// PDF file constants
export const PDF_PATH = '/uploads/pdfs/';

// Default endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ADMIN_LOGIN: '/api/auth/admin-login',
    VERIFY: '/api/auth/verify'
  },
  BOOKS: {
    GET_ALL: '/api/books',
    GET_FREE: '/api/books/free',
    GET_PREMIUM: '/api/books/premium',
    FAVORITES: '/api/books/favorites',
    READING_PROGRESS: '/api/books/reading-progress'
  },
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/update',
    PREMIUM: '/api/users/premium'
  }
};

// Default error messages
export const ERROR_MESSAGES = {
  GENERAL: 'Something went wrong. Please try again later.',
  AUTH: {
    LOGIN_FAILED: 'Login failed. Please check your credentials and try again.',
    REGISTER_FAILED: 'Registration failed. Please try again.'
  },
  BOOKS: {
    LOAD_FAILED: 'Failed to load books. Please try again.',
    PREMIUM_RESTRICTED: 'This content requires premium access.'
  }
};

export default {
  API_URL,
  API_TIMEOUT,
  ENDPOINTS,
  ERROR_MESSAGES
}; 