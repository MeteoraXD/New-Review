@echo off
echo ====================================================
echo Starting BookSansar with MongoDB compatibility mode
echo ====================================================
echo.
echo Admin credentials:
echo Email: admin@booksansar.com
echo Password: admin123
echo.
echo Setting up admin user...

cd server
node setupAdmin.js

echo.
echo Starting server on http://localhost:5000
echo Starting in a new window...
start cmd /k "cd server && node server.js"

echo.
echo Starting client on http://localhost:3000
cd ../client
npm start 