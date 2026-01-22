# Phase 3 Private Chats - Test Script

$baseUrl = "http://localhost:3000"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Phase 3 - Private Chats Test Suite" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create two test users and login
Write-Host "Step 1: Creating test users..." -ForegroundColor Yellow

# User 1
$user1Body = @{
    email = "user1$(Get-Random)@example.com"
    username = "user1$(Get-Random)"
    password = "password123"
} | ConvertTo-Json

$user1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $user1Body
$token1 = $user1.token
Write-Host "✅ User 1 created: $($user1.user.username)" -ForegroundColor Green

# User 2
$user2Body = @{
    email = "user2$(Get-Random)@example.com"
    username = "user2$(Get-Random)"
    password = "password123"
} | ConvertTo-Json

$user2 = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $user2Body
$token2 = $user2.token
Write-Host "✅ User 2 created: $($user2.user.username)`n" -ForegroundColor Green

# Step 2: Create private chat
Write-Host "Step 2: Creating private chat..." -ForegroundColor Yellow
$headers1 = @{ Authorization = "Bearer $token1" }
$createChatBody = @{
    username = $user2.user.username
} | ConvertTo-Json

try {
    $chatResponse = Invoke-RestMethod -Uri "$baseUrl/api/chats/private" -Method Post -ContentType "application/json" -Body $createChatBody -Headers $headers1
    $chatId = $chatResponse.chat.id
    Write-Host "✅ Private chat created!" -ForegroundColor Green
    Write-Host "   Chat ID: $chatId" -ForegroundColor White
    Write-Host "   Other participant: $($chatResponse.chat.other_participant.username)`n" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to create chat: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Try to create duplicate chat (should return existing)
Write-Host "Step 3: Testing duplicate chat prevention..." -ForegroundColor Yellow
try {
    $duplicateChat = Invoke-RestMethod -Uri "$baseUrl/api/chats/private" -Method Post -ContentType "application/json" -Body $createChatBody -Headers $headers1
    if ($duplicateChat.chat.id -eq $chatId) {
        Write-Host "✅ Correctly returned existing chat (no duplicate created)" -ForegroundColor Green
    } else {
        Write-Host "❌ Created duplicate chat instead of returning existing" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Send messages
Write-Host "`nStep 4: Sending messages..." -ForegroundColor Yellow

# User 1 sends message
$message1Body = @{ content = "Hello from User 1!" } | ConvertTo-Json
try {
    $msg1 = Invoke-RestMethod -Uri "$baseUrl/api/messages/$chatId" -Method Post -ContentType "application/json" -Body $message1Body -Headers $headers1
    Write-Host "✅ User 1 sent message: $($msg1.message.content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to send message: $($_.Exception.Message)" -ForegroundColor Red
}

# User 2 sends message
$headers2 = @{ Authorization = "Bearer $token2" }
$message2Body = @{ content = "Hi User 1! How are you?" } | ConvertTo-Json
try {
    $msg2 = Invoke-RestMethod -Uri "$baseUrl/api/messages/$chatId" -Method Post -ContentType "application/json" -Body $message2Body -Headers $headers2
    Write-Host "✅ User 2 sent message: $($msg2.message.content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to send message: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Get messages
Write-Host "`nStep 5: Getting message history..." -ForegroundColor Yellow
try {
    $messages = Invoke-RestMethod -Uri "$baseUrl/api/messages/$chatId" -Method Get -Headers $headers1
    Write-Host "✅ Retrieved $($messages.count) messages" -ForegroundColor Green
    $messages.messages | ForEach-Object {
        Write-Host "   [$($_.sender.username)]: $($_.content)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to get messages: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Get user chats
Write-Host "`nStep 6: Getting user chats..." -ForegroundColor Yellow
try {
    $chats = Invoke-RestMethod -Uri "$baseUrl/api/chats" -Method Get -Headers $headers1
    Write-Host "✅ User 1 has $($chats.count) chats" -ForegroundColor Green
    $chats.chats | ForEach-Object {
        Write-Host "   Chat ID: $($_.id), Other: $($_.other_participant.username), Last message: $($_.last_message.content)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed to get chats: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Test error cases
Write-Host "`nStep 7: Testing error cases..." -ForegroundColor Yellow

# Try to create chat with non-existent user
Write-Host "   Testing: Create chat with non-existent user..." -ForegroundColor Gray
$invalidBody = @{ username = "nonexistentuser12345" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/api/chats/private" -Method Post -ContentType "application/json" -Body $invalidBody -Headers $headers1 -ErrorAction Stop
    Write-Host "   ❌ Should have rejected non-existent user" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   ✅ Correctly rejected non-existent user" -ForegroundColor Green
    }
}

# Try to create chat with self
Write-Host "   Testing: Create chat with self..." -ForegroundColor Gray
$selfBody = @{ username = $user1.user.username } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$baseUrl/api/chats/private" -Method Post -ContentType "application/json" -Body $selfBody -Headers $headers1 -ErrorAction Stop
    Write-Host "   ❌ Should have rejected self-chat" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ Correctly rejected self-chat" -ForegroundColor Green
    }
}

# Try to send message to chat user is not member of
Write-Host "   Testing: Send message to non-member chat..." -ForegroundColor Gray
# Create a new chat between user2 and a third user
$user3Body = @{
    email = "user3$(Get-Random)@example.com"
    username = "user3$(Get-Random)"
    password = "password123"
} | ConvertTo-Json
$user3 = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $user3Body
$token3 = $user3.token
$headers3 = @{ Authorization = "Bearer $token3" }
$chat2Body = @{ username = $user2.user.username } | ConvertTo-Json
$chat2 = Invoke-RestMethod -Uri "$baseUrl/api/chats/private" -Method Post -ContentType "application/json" -Body $chat2Body -Headers $headers3
$chat2Id = $chat2.chat.id

# User 1 tries to send message to chat2 (not a member)
try {
    $invalidMsgBody = @{ content = "I shouldn't be able to send this" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/messages/$chat2Id" -Method Post -ContentType "application/json" -Body $invalidMsgBody -Headers $headers1 -ErrorAction Stop
    Write-Host "   ❌ Should have rejected message from non-member" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   ✅ Correctly rejected message from non-member" -ForegroundColor Green
    }
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Phase 3 Tests Completed!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

