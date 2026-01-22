# Phase 1 Authentication System Test Script (PowerShell)
# Tests all authentication endpoints

$baseUrl = "http://localhost:3000"
$testEmail = "test$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$testUsername = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')"
$testPassword = "password123"
$token = $null

Write-Host ""
Write-Host "============================================================"
Write-Host "Phase 1 Authentication System - Test Suite"
Write-Host "============================================================"
Write-Host ""

# Test 1: Register new user
Write-Host "`n🧪 Test 1: Register new user" -ForegroundColor Yellow
$registerBody = @{
    email = $testEmail
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
    Write-Host "✅ Registration successful" -ForegroundColor Green
    Write-Host "   User ID: $($response.user.id)"
    Write-Host "   Username: $($response.user.username)"
    Write-Host "   Email: $($response.user.email)"
    $token = $response.token
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Try to register with duplicate email
Write-Host "`n🧪 Test 2: Try to register with duplicate email" -ForegroundColor Yellow
$duplicateEmailBody = @{
    email = $testEmail
    username = "anotheruser"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $duplicateEmailBody -ErrorAction Stop
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
$duplicateUsernameBody = @{
    email = "another@example.com"
    username = $testUsername
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $duplicateUsernameBody -ErrorAction Stop
    Write-Host "❌ Should have rejected duplicate username" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected duplicate username" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Try to register with invalid password
Write-Host "`n🧪 Test 4: Try to register with invalid password (too short)" -ForegroundColor Yellow
$invalidPasswordBody = @{
    email = "new@example.com"
    username = "newuser"
    password = "123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $invalidPasswordBody -ErrorAction Stop
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
$invalidEmailBody = @{
    email = "notanemail"
    username = "newuser"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $invalidEmailBody -ErrorAction Stop
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
$loginEmailBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginEmailBody
    Write-Host "✅ Login with email successful" -ForegroundColor Green
    $token = $response.token
} catch {
    Write-Host "❌ Login with email failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Login with username
Write-Host "`n🧪 Test 7: Login with username" -ForegroundColor Yellow
$loginUsernameBody = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginUsernameBody
    Write-Host "✅ Login with username successful" -ForegroundColor Green
    $token = $response.token
} catch {
    Write-Host "❌ Login with username failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Login with wrong password
Write-Host "`n🧪 Test 8: Login with wrong password" -ForegroundColor Yellow
$wrongPasswordBody = @{
    email = $testEmail
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $wrongPasswordBody -ErrorAction Stop
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
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers
    Write-Host "✅ Protected route accessible with valid token" -ForegroundColor Green
    Write-Host "   User ID: $($response.user.id)"
    Write-Host "   Username: $($response.user.username)"
} catch {
    Write-Host "❌ Get me failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Get /api/auth/me without token
Write-Host "`n🧪 Test 10: Get /api/auth/me without token" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -ErrorAction Stop
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
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "❌ Should have rejected invalid token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ Correctly rejected invalid token" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "============================================================"
Write-Host "ℹ️  All tests completed!" -ForegroundColor Cyan
Write-Host "============================================================"
Write-Host ""

