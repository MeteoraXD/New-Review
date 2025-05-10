Write-Host "Starting BookSansar with local JSON storage..." -ForegroundColor Green
Write-Host ""
Write-Host "Admin credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@booksansar.com"
Write-Host "Password: admin123"
Write-Host ""
Set-Location -Path .\server
node localServer.js 