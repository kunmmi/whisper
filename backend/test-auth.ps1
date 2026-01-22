# Phase 1 Authentication System Test Script (PowerShell)
# Tests all authentication endpoints

$baseUrl = "http://localhost:3000"
$testEmail = "test$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$testUsername = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')"
$testPassword = "password123"
$token = $null

function Write-Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error {
    param($message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Info {
    param($message)
    Write-Host "ℹ️  $message" -ForegroundColor Cyan
}

function Write-Test {
    param($message)
    Write-Host ""
    Write-Host "🧪 $message" -ForegroundColor Yellow
}

$equals = "=" * 60
Write-Host ""
Write-Host $equals
Write-Host "Phase 1 Authentication System - Test Suite"
Write-Host $equals

# Test 1: Register new user
Write-Test "Test 1: Register new user"
$registerBody = @{
    email = $testEmail
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
    Write-Success "Registration successful"
    Write-Host "   User ID: $($response.user.id)"
    Write-Host "   Username: $($response.user.username)"
    Write-Host "   Email: $($response.user.email)"
    $token = $response.token
} catch {
    Write-Error "Registration failed: $($_.Exception.Message)"
    exit 1
}

# Test 2: Try to register with duplicate email
Write-Test "Test 2: Try to register with duplicate email"
$duplicateEmailBody = @{
    email = $testEmail
    username = "anotheruser"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $duplicateEmailBody -ErrorAction Stop
    Write-Error "Should have rejected duplicate email"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Success "Correctly rejected duplicate email"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# Test 3: Try to register with duplicate username
Write-Test "Test 3: Try to register with duplicate username"
$duplicateUsernameBody = @{
    email = "another@example.com"
    username = $testUsername
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $duplicateUsernameBody -ErrorAction Stop
    Write-Error "Should have rejected duplicate username"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Success "Correctly rejected duplicate username"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# Test 4: Try to register with invalid password (too short)
Write-Test "Test 4: Try to register with invalid password (too short)"
$invalidPasswordBody = @{
    email = "new@example.com"
    username = "newuser"
    password = "123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $invalidPasswordBody -ErrorAction Stop
    Write-Error "Should have rejected weak password"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Success "Correctly rejected weak password"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# Test 5: Try to register with invalid email format
Write-Test "Test 5: Try to register with invalid email format"
$invalidEmailBody = @{
    email = "notanemail"
    username = "newuser"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $invalidEmailBody -ErrorAction Stop
    Write-Error "Should have rejected invalid email"
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Success "Correctly rejected invalid email format"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# Test 6: Login with email
Write-Test "Test 6: Login with email"
$loginEmailBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginEmailBody
    Write-Success "Login with email successful"
    $token = $response.token
} catch {
    Write-Error "Login with email failed: $($_.Exception.Message)"
}

# Test 7: Login with username
Write-Test "Test 7: Login with username"
$loginUsernameBody = @{
    username = $testUsername
    password = $testPassword
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginUsernameBody
    Write-Success "Login with username successful"
    $token = $response.token
} catch {
    Write-Error "Login with username failed: $($_.Exception.Message)"
}

# Test 8: Login with wrong password
Write-Test "Test 8: Login with wrong password"
$wrongPasswordBody = @{
    email = $testEmail
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $wrongPasswordBody -ErrorAction Stop
    Write-Error "Should have rejected wrong password"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Success "Correctly rejected wrong password"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# Test 9: Get /api/auth/me with valid token
Write-Test "Test 9: Get /api/auth/me with valid token"
try {
    $headers = @{ Authorization = "Bearer $token" }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers
    Write-Success "Protected route accessible with valid token"
    Write-Host "   User ID: $($response.user.id)"
    Write-Host "   Username: $($response.user.username)"
} catch {
    Write-Error "Get me failed: $($_.Exception.Message)"
}

# Test 10: Get /api/auth/me without token
Write-Test "Test 10: Get /api/auth/me without token"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -ErrorAction Stop
    Write-Error "Should have rejected request without token"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Success "Correctly rejected request without token"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# Test 11: Get /api/auth/me with invalid token
Write-Test "Test 11: Get /api/auth/me with invalid token"
try {
    $headers = @{ Authorization = "Bearer invalid.token.here" }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers -ErrorAction Stop
    Write-Error "Should have rejected invalid token"
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Success "Correctly rejected invalid token"
    } else {
        Write-Error "Unexpected error: $($_.Exception.Message)"
    }
}

# Summary
Write-Host ""
Write-Host $equals
Write-Info "All tests completed!"
Write-Host $equals
Write-Host ""

