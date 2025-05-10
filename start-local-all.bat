@echo off
echo Starting BookSansar with local JSON storage...
echo.
echo Admin credentials:
echo Email: admin@booksansar.com
echo Password: admin123
echo.

REM Setup admin user
cd server
node setupAdmin.js

REM Start the server
echo Starting server on http://localhost:5000
echo Use Ctrl+C to stop the server when finished
node localServer.js 