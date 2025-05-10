@echo off
echo Starting BookSansar server with MongoDB...
echo.
echo Creating admin user...
cd server
node createAdmin.js
echo.
echo Starting server on http://localhost:5000
node server.js 