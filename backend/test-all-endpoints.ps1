# Phase 1 Authentication System - Complete Test Suite
# Run all endpoints tests in one go

$baseUrl = "http://localhost:3000"
$random = Get-Random -Minimum 1000000 -Maximum 9999999
$testEmail = "test$random@example.com"
$testUsername = "testuser$random"
$testPassword = "password123"
$token = $null

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Phase 1 Authentication System - Complete Test Suite" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test User:" -ForegroundColor Yellow
Write-Host "  Email: $testEmail"
Write-Host "  Username: $testUsername"
Write-Host ""

# Test 1: Register new user
Write-Host "🧪 Test 1: Register new user" -ForegroundColor Yellow
$body = @{
    email = $testEmail
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $body
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host "   User ID: $($response.user.id)"
    Write-Host "   Username: $($response.user.username)"
    Write-Host "   Email: $($response.user.email)"
    $token = $response.token
    Write-Host "   Token: $($token.Substring(0,30))..."
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    # Try to get error details
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Error details: $errorBody" -ForegroundColor Yellow
    }
    exit 1
}

# Test 2: Try to register with duplicate email
Write-Host "`n🧪 Test 2: Try to register with duplicate email" -ForegroundColor Yellow
$body = @{
    email = $testEmail
    username = "anotheruser"
    password = $testPassword
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host "❌ Should have rejected duplicate email" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected duplicate email" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Try to register with duplicate username
Write-Host "`n🧪 Test 3: Try to register with duplicate username" -ForegroundColor Yellow
$body = @{
    email = "another@example.com"
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host "❌ Should have rejected duplicate username" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected duplicate username" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Try to register with invalid password (too short)
Write-Host "`n🧪 Test 4: Try to register with invalid password (too short)" -ForegroundColor Yellow
$body = @{
    email = "new@example.com"
    username = "newuser"
    password = "123"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host "❌ Should have rejected weak password" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected weak password" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Try to register with invalid email format
Write-Host "`n🧪 Test 5: Try to register with invalid email format" -ForegroundColor Yellow
$body = @{
    email = "notanemail"
    username = "newuser"
    password = $testPassword
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host "❌ Should have rejected invalid email" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected invalid email format" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Login with email
Write-Host "`n🧪 Test 6: Login with email" -ForegroundColor Yellow
$body = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    Write-Host "✅ Login with email successful!" -ForegroundColor Green
    Write-Host "   Username: $($response.user.username)"
    $token = $response.token
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Login with username
Write-Host "`n🧪 Test 7: Login with username" -ForegroundColor Yellow
$body = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $body
    Write-Host "✅ Login with username successful!" -ForegroundColor Green
    Write-Host "   Username: $($response.user.username)"
    $token = $response.token
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Login with wrong password
Write-Host "`n🧪 Test 8: Login with wrong password" -ForegroundColor Yellow
$body = @{
    email = $testEmail
    password = "wrongpassword"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $body -ErrorAction Stop
    Write-Host "❌ Should have rejected wrong password" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Correctly rejected wrong password" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 9: Get /api/auth/me with valid token
Write-Host "`n🧪 Test 9: Get /api/auth/me with valid token" -ForegroundColor Yellow
if ($token) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers
        Write-Host "✅ Protected route accessible with valid token!" -ForegroundColor Green
        Write-Host "   User ID: $($response.user.id)"
        Write-Host "   Username: $($response.user.username)"
        Write-Host "   Email: $($response.user.email)"
    } catch {
        Write-Host "❌ Get me failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  No token available (run login test first)" -ForegroundColor Yellow
}

# Test 10: Get /api/auth/me without token
Write-Host "`n🧪 Test 10: Get /api/auth/me without token" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -ErrorAction Stop
    Write-Host "❌ Should have rejected request without token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Correctly rejected request without token" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 11: Get /api/auth/me with invalid token
Write-Host "`n🧪 Test 11: Get /api/auth/me with invalid token" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer invalid.token.here" }
    Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "❌ Should have rejected invalid token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ Correctly rejected invalid token" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 12: Health check
Write-Host "`n🧪 Test 12: Health check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health"
    Write-Host "✅ Health check successful!" -ForegroundColor Green
    Write-Host "   Status: $($response.status)"
    Write-Host "   Message: $($response.message)"
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ All Phase 1 Tests Completed!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

