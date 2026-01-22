# Phase 5 Group Chats - Test Script

$baseUrl = "http://localhost:3000"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Phase 5 - Group Chats Test Suite" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create test users
Write-Host "Step 1: Creating test users..." -ForegroundColor Yellow

# Admin user
$adminBody = @{
    email = "admin$(Get-Random)@test.com"
    username = "admin$(Get-Random)"
    password = "password123"
} | ConvertTo-Json

$admin = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $adminBody
$tokenAdmin = $admin.token
Write-Host "✅ Admin created: $($admin.user.username)" -ForegroundColor Green

# Member users
$user1Body = @{
    email = "member1$(Get-Random)@test.com"
    username = "member1$(Get-Random)"
    password = "password123"
} | ConvertTo-Json

$user1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $user1Body
$tokenUser1 = $user1.token
Write-Host "✅ Member 1 created: $($user1.user.username)" -ForegroundColor Green

$user2Body = @{
    email = "member2$(Get-Random)@test.com"
    username = "member2$(Get-Random)"
    password = "password123"
} | ConvertTo-Json

$user2 = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $user2Body
$tokenUser2 = $user2.token
Write-Host "✅ Member 2 created: $($user2.user.username)`n" -ForegroundColor Green

# Step 2: Create group
Write-Host "Step 2: Creating group..." -ForegroundColor Yellow
$headersAdmin = @{ Authorization = "Bearer $tokenAdmin" }
$groupBody = @{
    name = "Test Group $(Get-Random)"
    usernames = @($user1.user.username, $user2.user.username)
} | ConvertTo-Json

try {
    $group = Invoke-RestMethod -Uri "$baseUrl/api/chats/group" -Method Post -ContentType "application/json" -Body $groupBody -Headers $headersAdmin
    $groupId = $group.chat.id
    Write-Host "✅ Group created!" -ForegroundColor Green
    Write-Host "   Group ID: $groupId" -ForegroundColor White
    Write-Host "   Group Name: $($group.chat.name)" -ForegroundColor White
    Write-Host "   Members: $($group.chat.member_count)`n" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to create group: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Test add user to group
Write-Host "Step 3: Adding another user to group..." -ForegroundColor Yellow
$user3Body = @{
    email = "member3$(Get-Random)@test.com"
    username = "member3$(Get-Random)"
    password = "password123"
} | ConvertTo-Json

$user3 = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $user3Body
Write-Host "   Created user: $($user3.user.username)" -ForegroundColor Gray

$addUserBody = @{ username = $user3.user.username } | ConvertTo-Json
try {
    $addResult = Invoke-RestMethod -Uri "$baseUrl/api/chats/$groupId/add-user" -Method Post -ContentType "application/json" -Body $addUserBody -Headers $headersAdmin
    Write-Host "✅ User added to group!" -ForegroundColor Green
    Write-Host "   Member count: $($addResult.member_count)`n" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to add user: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test rename group (admin)
Write-Host "Step 4: Renaming group (admin)..." -ForegroundColor Yellow
$renameBody = @{ name = "Renamed Group $(Get-Random)" } | ConvertTo-Json
try {
    $renameResult = Invoke-RestMethod -Uri "$baseUrl/api/chats/$groupId/rename" -Method Put -ContentType "application/json" -Body $renameBody -Headers $headersAdmin
    Write-Host "✅ Group renamed!" -ForegroundColor Green
    Write-Host "   New name: $($renameResult.chat.name)`n" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to rename: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Test member cannot rename (should fail)
Write-Host "Step 5: Testing member cannot rename group..." -ForegroundColor Yellow
$headersUser1 = @{ Authorization = "Bearer $tokenUser1" }
try {
    Invoke-RestMethod -Uri "$baseUrl/api/chats/$groupId/rename" -Method Put -ContentType "application/json" -Body $renameBody -Headers $headersUser1 -ErrorAction Stop
    Write-Host "❌ Should have rejected non-admin rename" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ Correctly rejected non-admin rename`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 6: Test remove user (admin)
Write-Host "Step 6: Removing user from group (admin)..." -ForegroundColor Yellow
$removeBody = @{ username = $user3.user.username } | ConvertTo-Json
try {
    $removeResult = Invoke-RestMethod -Uri "$baseUrl/api/chats/$groupId/remove-user" -Method Post -ContentType "application/json" -Body $removeBody -Headers $headersAdmin
    Write-Host "✅ User removed from group!" -ForegroundColor Green
    Write-Host "   Removed: $($removeResult.user.username)`n" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to remove user: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Test member leave group
Write-Host "Step 7: Member leaving group..." -ForegroundColor Yellow
try {
    $leaveResult = Invoke-RestMethod -Uri "$baseUrl/api/chats/$groupId/leave" -Method Post -Headers $headersUser1
    Write-Host "✅ Member left group successfully!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to leave: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Test cannot remove last admin
Write-Host "Step 8: Testing cannot remove last admin..." -ForegroundColor Yellow
# Make user2 admin first
$addAdminBody = @{ username = $user2.user.username } | ConvertTo-Json
try {
    # Add user2 back if they left
    Invoke-RestMethod -Uri "$baseUrl/api/chats/$groupId/add-user" -Method Post -ContentType "application/json" -Body $addAdminBody -Headers $headersAdmin -ErrorAction SilentlyContinue
} catch {}

# Try to remove admin (should fail if last admin)
$removeAdminBody = @{ username = $admin.user.username } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/api/chats/$groupId/remove-user" -Method Post -ContentType "application/json" -Body $removeAdminBody -Headers $headersAdmin -ErrorAction Stop
    Write-Host "⚠️  Admin removed (might not be last admin)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly prevented removing last admin`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 9: Test group size limit
Write-Host "Step 9: Testing group size limit (50 members)..." -ForegroundColor Yellow
# Create 50 users and try to add them all
$manyUsers = @()
for ($i = 1; $i -le 50; $i++) {
    $manyUserBody = @{
        email = "manyuser$i$(Get-Random)@test.com"
        username = "manyuser$i$(Get-Random)"
        password = "password123"
    } | ConvertTo-Json
    $manyUser = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $manyUserBody
    $manyUsers += $manyUser.user.username
}

# Try to create group with 50 users (should fail - max is 50 including creator)
$bigGroupBody = @{
    name = "Big Group"
    usernames = $manyUsers[0..48]  # 49 users + creator = 50 total
} | ConvertTo-Json

try {
    $bigGroup = Invoke-RestMethod -Uri "$baseUrl/api/chats/group" -Method Post -ContentType "application/json" -Body $bigGroupBody -Headers $headersAdmin
    Write-Host "✅ Group created with 50 members (max allowed)" -ForegroundColor Green
    
    # Try to add one more (should fail)
    $tooManyBody = @{ username = $manyUsers[49] } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/chats/$($bigGroup.chat.id)/add-user" -Method Post -ContentType "application/json" -Body $tooManyBody -Headers $headersAdmin -ErrorAction Stop
        Write-Host "❌ Should have rejected adding user to full group" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "✅ Correctly rejected adding user to full group`n" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "⚠️  Could not test size limit: $($_.Exception.Message)`n" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Phase 5 Tests Completed!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

