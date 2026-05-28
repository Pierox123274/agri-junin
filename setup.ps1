# Configuracion inicial AgriJunin (Windows PowerShell)
# Uso: .\setup.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "=== AgriJunin - configuracion inicial ===" -ForegroundColor Green

$envExample = Join-Path $root "backend\.env.example"
$envFile = Join-Path $root "backend\.env"
if (-not (Test-Path $envFile)) {
  Copy-Item $envExample $envFile
  Write-Host "[OK] Creado backend\.env desde .env.example" -ForegroundColor Cyan
  Write-Host "     Edite backend\.env: MySQL, Trefle, Google Maps, etc."
} else {
  Write-Host "[OK] backend\.env ya existe"
}

Write-Host ""
Write-Host "Instalando dependencias del backend..."
Set-Location (Join-Path $root "backend")
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Instalando dependencias del frontend..."
Set-Location (Join-Path $root "frontend")
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location $root

Write-Host ""
Write-Host "=== Base de datos MySQL ===" -ForegroundColor Yellow
Write-Host "Ejecute en MySQL:"
Write-Host '  mysql -u root -p -e "source backend/database/agri_junin_completo.sql"'
Write-Host "O importe agri_junin_completo.sql desde MySQL Workbench."
Write-Host ""
Write-Host "Si el login falla: cd backend; node database/fix-passwords.js"
Write-Host ""
Write-Host "Iniciar app: .\start.ps1"
Write-Host "Login demo: admin@agrijunin.pe / Admin123!" -ForegroundColor Cyan
