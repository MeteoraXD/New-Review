# BookSansar Backend API Documentation

This is the backend API for BookSansar, a book management and reading platform with premium features, role-based access control, and social features.

## Access Control Matrix Implementation

The system implements a comprehensive access control system with the following user roles:

- **Guest**: Unauthenticated users with limited access
- **Reader**: Regular authenticated users
- **Author**: Content creators who can publish books
- **Admin**: System administrators with full access

### Role Permissions

| Feature/Action | Guest | Reader | Author | Admin |
|----------------|-------|--------|--------|-------|
| View Books List | ✅ | ✅ | ✅ | ✅ |
| Read Free Books | ✅ | ✅ | ✅ | ✅ |
| Read Premium Books | ❌ | ❌ (Premium Only) | ✅ | ✅ |
| Add to Favorites | ❌ | ✅ | ✅ | ✅ |
| Track Reading Progress | ❌ | ✅ | ✅ | ✅ |
| Add Reviews/Ratings | ❌ | ✅ | ✅ | ✅ |
| Add New Books | ❌ | ❌ | ✅ | ✅ |
| Edit Own Books | ❌ | ❌ | ✅ | ✅ |
| Delete Books | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| View Dashboard | ❌ | ✅ | ✅ | ✅ |
| View System Stats | ❌ | ❌ | ❌ | ✅ |

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/create-admin` - Create admin (protected by secret key)

### Books

- `GET /api/books` - Get all books
- `GET /api/books/free` - Get free books
- `GET /api/books/premium` - Get premium books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create new book (Author/Admin)
- `PUT /api/books/:id` - Update book (Author/Admin)
- `DELETE /api/books/:id` - Delete book (Admin)
- `POST /api/books/upload-pdf` - Upload book PDF (Author/Admin)

### User Features

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get user dashboard stats

### Favorites

- `POST /api/books/:id/favorites` - Add book to favorites
- `DELETE /api/books/:id/favorites` - Remove book from favorites
- `GET /api/books/user/favorites` - Get user's favorite books

### Reading History

- `POST /api/books/:id/reading-progress` - Update reading progress
- `GET /api/books/user/reading-history` - Get user's reading history

### Premium Features

- `GET /api/premium/status` - Get premium status
- `POST /api/premium/subscribe` - Subscribe to premium
- `POST /api/premium/cancel` - Cancel premium subscription

### Admin Features

- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get system stats
- `POST /api/premium/admin/set-status` - Set user's premium status

## Models

### User

```javascript
{
  username: String,
  email: String,
  password: String,
  role: String ('reader', 'author', 'admin'),
  isPremium: Boolean,
  premiumExpiry: Date,
  favoriteBooks: [BookID],
  readingHistory: [{
    book: BookID,
    lastReadPage: Number,
    lastReadAt: Date
  }],
  profilePicture: String,
  createdAt: Date,
  lastLogin: Date
}
```

### Book

```javascript
{
  title: String,
  author: String,
  description: String,
  price: Number,
  coverImage: String,
  pdfUrl: String,
  isPremium: Boolean,
  category: String,
  publishedYear: Number,
  pages: Number,
  rating: Number,
  reviews: [{
    user: UserID,
    rating: Number,
    comment: String,
    date: Date
  }]
}
```

## Authentication and Authorization

The API uses JWT tokens for authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Errors include a message field explaining what went wrong. 