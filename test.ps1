$BASE = "http://localhost:3000"
$WEBHOOK_URL = "https://webhook.site/d1253c1a-93f1-4f74-b641-4f0cb082e61e"

Write-Host "========================================"
Write-Host "1. Register admin"
Write-Host "========================================"
try {
  Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -ContentType "application/json" -Body '{"username":"admin","email":"admin@test.com","password":"admin123","role":"ADMIN"}' | ConvertTo-Json
} catch {
  Write-Host "Already registered (or error): $($_.Exception.Message)"
}

Write-Host ""
Write-Host "========================================"
Write-Host "2. Login -> extracting token"
Write-Host "========================================"
$login = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$TOKEN = $login.access_token
Write-Host "Token: $($TOKEN.Substring(0, 40))..."

Write-Host ""
Write-Host "========================================"
Write-Host "3. Register webhook"
Write-Host "========================================"
$headers = @{ Authorization = "Bearer $TOKEN" }
$body = @{ url = $WEBHOOK_URL; secret = "mysecret"; events = @("CREATED","UPDATED","DELETED") } | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE/webhooks" -Method POST -Headers $headers -ContentType "application/json" -Body $body | ConvertTo-Json

Write-Host ""
Write-Host "========================================"
Write-Host "4. Create CV -> triggers the webhook"
Write-Host "========================================"
$cv = @{ name = "Doe"; firstname = "John"; age = 25; cin = "12345678"; job = "Developer"; path = "" } | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE/cvs" -Method POST -Headers $headers -ContentType "application/json" -Body $cv | ConvertTo-Json

Write-Host ""
Write-Host "========================================"
Write-Host "5. List registered webhooks"
Write-Host "========================================"
Invoke-RestMethod -Uri "$BASE/webhooks" -Headers $headers | ConvertTo-Json

Write-Host ""
Write-Host "========================================"
Write-Host "6. List CV events (history)"
Write-Host "========================================"
Invoke-RestMethod -Uri "$BASE/cv-events" -Headers $headers | ConvertTo-Json

Write-Host ""
Write-Host "========================================"
Write-Host "Done. Check webhook.site for the incoming request."
Write-Host "========================================"
