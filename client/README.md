# Book Sansar - Digital Library Platform

Book Sansar is a modern digital library platform that allows users to browse, read, and track their reading progress. The platform features a responsive design and provides a seamless experience for both readers and authors.

## Features

- User authentication (login/register)
- Personalized dashboard
- Book browsing and search
- Reading progress tracking
- Reading statistics
- Role-based access (Reader, Author, Admin)
- Responsive design for all devices

## Tech Stack

- React.js
- Material-UI
- React Router
- Axios
- React Toastify

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/book-sansar.git
cd book-sansar
```

2. Install dependencies:
```bash
cd client
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
client/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx
│   │   └── layout/
│   │       ├── Navbar.jsx
│   │       ├── Sidebar.jsx
│   │       ├── AuthLayout.jsx
│   │       └── PublicLayout.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── AuthDashboard.jsx
│   │   └── PublicDashboard.jsx
│   ├── App.jsx
│   ├── index.js
│   ├── theme.js
│   └── index.css
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
