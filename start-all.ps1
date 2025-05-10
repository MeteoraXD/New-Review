Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Starting BookSansar with MongoDB compatibility mode" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@booksansar.com"
Write-Host "Password: admin123"
Write-Host ""
Write-Host "Setting up admin user..." -ForegroundColor Green

Set-Location -Path .\server
node setupAdmin.js

Write-Host ""
Write-Host "Starting server on http://localhost:5000" -ForegroundColor Green
Write-Host "Starting in a new window..." -ForegroundColor Green

# Start server in a new PowerShell window
Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$PWD'; node server.js"

Write-Host ""
Write-Host "Starting client on http://localhost:3000" -ForegroundColor Green
Set-Location -Path ..\client
npm start 