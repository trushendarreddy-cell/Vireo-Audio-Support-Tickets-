# One-click startup for Vireo Audio — Support Intelligence
Write-Host "Starting Vireo Audio Support Intelligence Backend on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process python -ArgumentList "-m uvicorn backend.main:app --port 8000" -WindowStyle Minimized

Write-Host "Starting Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process npm -ArgumentList "run start -- -p 3000" -WorkingDirectory "$PSScriptRoot\frontend" -WindowStyle Minimized

Write-Host "`nBoth services started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Yellow
