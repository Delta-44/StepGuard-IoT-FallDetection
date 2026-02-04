# Script de prueba de endpoints del sistema de IA
Write-Host "`n🧪 Probando Sistema de IA - StepGuard`n" -ForegroundColor Green

# Test 1: Health Check
Write-Host "1. Health Check..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/ai/health" -Method GET
    Write-Host "✅ Health Check exitoso" -ForegroundColor Green
    $health | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en Health Check: $_" -ForegroundColor Red
}

Write-Host "`n" -NoNewline

# Test 2: Status
Write-Host "2. Status del Sistema..." -ForegroundColor Cyan
try {
    $status = Invoke-RestMethod -Uri "http://localhost:3000/api/ai/status" -Method GET
    Write-Host "✅ Status exitoso" -ForegroundColor Green
    $status | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error en Status: $_" -ForegroundColor Red
}

Write-Host "`n" -NoNewline

# Test 3: Endpoint raíz
Write-Host "3. Endpoint raíz..." -ForegroundColor Cyan
try {
    $root = Invoke-RestMethod -Uri "http://localhost:3000/" -Method GET
    Write-Host "✅ Endpoint raíz exitoso" -ForegroundColor Green
    $root | ConvertTo-Json
} catch {
    Write-Host "❌ Error en endpoint raíz: $_" -ForegroundColor Red
}

Write-Host "`n✨ Pruebas completadas!`n" -ForegroundColor Green
