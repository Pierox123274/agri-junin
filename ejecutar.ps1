# AgriJunin — arranque completo (BD + APIs + backend + frontend)
# Uso: .\ejecutar.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "=== AgriJunin — inicio completo ===" -ForegroundColor Green

# .env
$envFile = Join-Path $root "backend\.env"
if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $root "backend\.env.example") $envFile
  Write-Host "[!] Se creo backend\.env — complete sus claves y vuelva a ejecutar." -ForegroundColor Yellow
  notepad $envFile
  exit 1
}

# Dependencias
if (-not (Test-Path (Join-Path $root "backend\node_modules"))) {
  Write-Host "Instalando backend..."
  Set-Location (Join-Path $root "backend"); npm install; Set-Location $root
}
if (-not (Test-Path (Join-Path $root "frontend\node_modules"))) {
  Write-Host "Instalando frontend..."
  Set-Location (Join-Path $root "frontend"); npm install; Set-Location $root
}

# Contraseñas demo
Write-Host "Verificando usuarios demo..."
Set-Location (Join-Path $root "backend")
node database/fix-passwords.js | Out-Null
Set-Location $root

# Liberar puertos
foreach ($port in 3000, 4200) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1

# Backend
Write-Host "Iniciando backend..."
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$root\backend'; Write-Host 'Backend AgriJunin' -ForegroundColor Green; npm run dev"
)

# Esperar API
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch { }
}
if (-not $ready) {
  Write-Host "[!] Backend tardo en responder. Revise MySQL y backend\.env" -ForegroundColor Yellow
} else {
  Write-Host "[OK] Backend en http://localhost:3000/api" -ForegroundColor Cyan
}

# Verificacion
Set-Location (Join-Path $root "backend")
node scripts/verificar-sistema.js
$verifyOk = $LASTEXITCODE -eq 0
Set-Location $root

# Frontend
Write-Host "Iniciando frontend..."
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$root\frontend'; Write-Host 'Frontend AgriJunin' -ForegroundColor Green; npx ng serve --host 127.0.0.1 --port 4200 --open"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  App:   http://127.0.0.1:4200" -ForegroundColor White
Write-Host "  API:   http://localhost:3000/api" -ForegroundColor White
Write-Host "  Login: admin@agrijunin.pe / Admin123!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
if (-not $verifyOk) {
  Write-Host "Hay advertencias arriba; la app puede abrirse igual." -ForegroundColor Yellow
}
