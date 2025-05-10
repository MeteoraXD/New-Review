# Book Sansar - E-Library Platform

Book Sansar is a modern e-library platform that connects readers with authors, providing access to a diverse collection of books across various genres and languages.

## Features

- User Authentication (Readers and Authors)
- Book Management
- Premium Content Access
- Book Reviews and Ratings
- Search and Filter Books
- User Profiles
- Admin Dashboard

## Tech Stack

- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT
- Frontend: React.js (coming soon)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/book-sansar.git
cd book-sansar
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Books
- GET `/api/books` - Get all books
- GET `/api/books/:id` - Get single book
- POST `/api/books` - Create new book (Authors only)
- PUT `/api/books/:id` - Update book (Authors only)
- DELETE `/api/books/:id` - Delete book (Authors only)
- POST `/api/books/:id/reviews` - Add review to book

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape Book Sansar
- Special thanks to the open-source community for their valuable tools and libraries

## Local Setup (No Database Required)

If you want to run BookSansar without setting up MongoDB, we've provided a simplified version that uses local JSON files for storage:

1. Run `npm install` in both the `client` and `server` directories
2. Use one of the following commands to start the local server:
   - Windows: Double-click `start-local.bat` or run it from command prompt
   - Mac/Linux: Run `./start-local.sh` (you may need to make it executable with `chmod +x start-local.sh`)
3. In a separate terminal, start the React client: `cd client && npm start`
4. Access the application at `http://localhost:3000`

Default admin credentials:
- Email: admin@booksansar.com
- Password: admin123

## Running with MongoDB

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- NPM or Yarn

### Installation

1. Clone the repository
2. Install server dependencies:
   ```
   cd server
   npm install
   ```
3. Install client dependencies:
   ```
   cd client
   npm install
   ```
4. Create a `.env` file in the server directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

### Starting the Application

1. Start the server:
   ```
   cd server
   npm start
   ```
2. Start the client:
   ```
   cd client
   npm start
   ```
3. Access the application at `http://localhost:3000`

### Create Admin User

To create an admin user, run:
```
cd server
node createAdmin.js
```

This will create a default admin with:
- Email: admin@booksansar.com
- Password: admin123

You can also create a custom admin by providing email and password:
```
node createAdmin.js your-email@example.com your-password 