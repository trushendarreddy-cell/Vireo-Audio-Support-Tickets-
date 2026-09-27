# One-click startup for Vireo Audio — Support Intelligence
$ErrorActionPreference = "Stop"

Write-Host "Starting Vireo Audio Support Intelligence..." -ForegroundColor Cyan

Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install -r "$PSScriptRoot\requirements.txt"

Write-Host "Building frontend..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\frontend"
npm install
npm run build
Pop-Location

Write-Host "Starting backend on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process python -ArgumentList "-m uvicorn backend.main:app --port 8000" -WorkingDirectory $PSScriptRoot -WindowStyle Minimized

Write-Host "Starting frontend on http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process npm -ArgumentList "run start -- -p 3000" -WorkingDirectory "$PSScriptRoot\frontend" -WindowStyle Minimized

Write-Host "Both services started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Yellow
