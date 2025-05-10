Write-Host "Starting BookSansar with local JSON storage..." -ForegroundColor Green
Write-Host ""
Write-Host "Admin credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@booksansar.com"
Write-Host "Password: admin123"
Write-Host ""

# Setup local JSON data first
Write-Host "Setting up admin user..." -ForegroundColor Cyan
Set-Location -Path .\server
node setupAdmin.js

# Start server in the background
Write-Host "Starting server..." -ForegroundColor Cyan
$serverJob = Start-Job -ScriptBlock {
    Set-Location -Path $using:PWD
    node localServer.js
}

Write-Host "Server started in background job" -ForegroundColor Green
Write-Host "Server running on http://localhost:5000" -ForegroundColor Green

# Wait a moment for the server to fully start
Start-Sleep -Seconds 2

# Start client
Write-Host "Starting client..." -ForegroundColor Cyan
Set-Location -Path ..\client
npm start

# If client exits, stop the server job
Stop-Job -Job $serverJob
Remove-Job -Job $serverJob 