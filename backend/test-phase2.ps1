# Phase 2 User Search - Test Script

$baseUrl = "http://localhost:3000"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Phase 2 - User Search Test Suite" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login to get token
Write-Host "Step 1: Login to get token..." -ForegroundColor Yellow
$loginBody = @{
    email = "test6617457@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.token
    $currentUserId = $loginResponse.user.id
    $currentUsername = $loginResponse.user.username
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   Current user: $currentUsername (ID: $currentUserId)`n" -ForegroundColor White
} catch {
    Write-Host "Creating new test user..." -ForegroundColor Yellow
    $registerBody = @{
        email = "searcher$(Get-Random)@example.com"
        username = "searcher$(Get-Random)"
        password = "password123"
    } | ConvertTo-Json
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
    $token = $registerResponse.token
    $currentUserId = $registerResponse.user.id
    $currentUsername = $registerResponse.user.username
    Write-Host "✅ Test user created!" -ForegroundColor Green
    Write-Host "   Current user: $currentUsername (ID: $currentUserId)`n" -ForegroundColor White
}

# Step 2: Test user search
Write-Host "Step 2: Testing user search..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }

try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/search?username=test" -Method Get -Headers $headers
    Write-Host "✅ Search successful!" -ForegroundColor Green
    Write-Host "   Found $($searchResponse.count) users:" -ForegroundColor White
    if ($searchResponse.users.Count -gt 0) {
        $searchResponse.users | ForEach-Object {
            Write-Host "   - $($_.username) (ID: $($_.id))" -ForegroundColor White
        }
    } else {
        Write-Host "   (No users found)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Search failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test search without token
Write-Host "`nStep 3: Testing search without token (should fail)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/users/search?username=test" -Method Get -ErrorAction Stop
    Write-Host "❌ Should have rejected request without token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Correctly rejected request without token" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 4: Test search with empty query
Write-Host "`nStep 4: Testing search with empty query (should fail)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/users/search?username=" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "❌ Should have rejected empty query" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly rejected empty query" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 5: Verify current user is excluded
Write-Host "`nStep 5: Verifying current user is excluded..." -ForegroundColor Yellow
Write-Host "   Searching for: $currentUsername" -ForegroundColor White
try {
    $searchResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/search?username=$currentUsername" -Method Get -Headers $headers
    $foundSelf = $searchResponse.users | Where-Object { $_.username -eq $currentUsername }
    if ($foundSelf) {
        Write-Host "❌ Current user should be excluded from results" -ForegroundColor Red
    } else {
        Write-Host "✅ Current user correctly excluded from results" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Phase 2 Tests Completed!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

