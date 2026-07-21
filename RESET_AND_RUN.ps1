$ErrorActionPreference = "Stop"

Write-Host "Preparing Trash2Cash..." -ForegroundColor Cyan

if (Test-Path ".\app") {
  Remove-Item ".\app" -Recurse -Force
}
if (Test-Path ".\.next") {
  Remove-Item ".\.next" -Recurse -Force
}
if (Test-Path ".\node_modules") {
  Remove-Item ".\node_modules" -Recurse -Force
}

npm config set registry https://registry.npmjs.org/
npm ci
npm run dev
