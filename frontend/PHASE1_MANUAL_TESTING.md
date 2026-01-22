# Phase 1 — Manual Testing Guide

## Backend Testing (Phase 1)

Phase 1 focuses on backend authentication. Frontend will be built in Phase 6.

---

## Prerequisites

1. **Backend server must be running:**
   ```powershell
   cd backend
   npm start
   ```
   Server should be running on `http://localhost:3000`

2. **Tools you can use:**
   - **Postman** (recommended - easiest GUI)
   - **PowerShell** (built into Windows)
   - **curl** (if available)
   - **Browser** (for GET requests only)

---

## Test 1: Register a New User

### Using Postman:
1. Method: **POST**
2. URL: `http://localhost:3000/api/auth/register`
3. Headers: 
   - `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "email": "john@example.com",
     "username": "johndoe",
     "password": "password123"
   }
   ```
5. Click **Send**
6. **Expected Response (201):**
   ```json
   {
     "message": "User registered successfully",
     "user": {
       "id": 1,
       "username": "johndoe",
       "email": "john@example.com",
       "created_at": "2026-01-20T12:00:00.000Z"
     },
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```
7. **Save the token** - you'll need it for protected routes!

### Using PowerShell:
```powershell
$body = @{
    email = "john@example.com"
    username = "johndoe"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json -Depth 10
$token = $response.token  # Save token for later tests
```

---

## Test 2: Try to Register with Duplicate Email

### Using Postman:
1. Method: **POST**
2. URL: `http://localhost:3000/api/auth/register`
3. Body (use the same email from Test 1):
   ```json
   {
     "email": "john@example.com",
     "username": "anotheruser",
     "password": "password123"
   }
   ```
4. **Expected Response (400):**
   ```json
   {
     "error": "Email already exists"
   }
   ```

### Using PowerShell:
```powershell
$body = @{
    email = "john@example.com"  # Same email as Test 1
    username = "anotheruser"
    password = "password123"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
} catch {
    Write-Host "Error (expected): $($_.Exception.Message)"
    # Should return 400 status
}
```

---

## Test 3: Try to Register with Duplicate Username

### Using Postman:
1. Method: **POST**
2. URL: `http://localhost:3000/api/auth/register`
3. Body (use the same username from Test 1):
   ```json
   {
     "email": "different@example.com",
     "username": "johndoe",
     "password": "password123"
   }
   ```
4. **Expected Response (400):**
   ```json
   {
     "error": "Username already exists"
   }
   ```

---

## Test 4: Try to Register with Invalid Password (Too Short)

### Using Postman:
1. Method: **POST**
2. URL: `http://localhost:3000/api/auth/register`
3. Body:
   ```json
   {
     "email": "new@example.com",
     "username": "newuser",
     "password": "123"
   }
   ```
4. **Expected Response (400):**
   ```json
   {
     "error": "Password must be at least 8 characters long"
   }
   ```

---

## Test 5: Try to Register with Invalid Email Format

### Using Postman:
1. Method: **POST**
2. URL: `http://localhost:3000/api/auth/register`
3. Body:
   ```json
   {
     "email": "notanemail",
     "username": "newuser",
     "password": "password123"
   }
   ```
4. **Expected Response (400):**
   ```json
   {
     "error": "Invalid email format"
   }
   ```

---

## Test 6: Login with Email

### Using Postman:
1. Method: **POST**
2. URL: `http://localhost:3000/api/auth/login`
3. Body:
   ```json
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```
4. **Expected Response (200):**
   ```json
   {
     "message": "Login successful",
     "user": {
       "id": 1,
       "username": "johndoe",
       "email": "john@example.com",
       "created_at": "2026-01-20T12:00:00.000Z"
     },
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```
5. **Save the token** for Test 9!

### Using PowerShell:
```powershell
$body = @{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$token = $response.token  # Save token
$response | ConvertTo-Json -Depth 10
```

---

## Test 7: Login with Username

### Using Postman:
1. Method: **POST**
2. URL: `http://localhost:3000/api/auth/login`
3. Body (note: using username instead of email):
   ```json
   {
     "username": "johndoe",
     "password": "password123"
   }
   ```
4. **Expected Response (200):** Same as Test 6

---

## Test 8: Login with Wrong Password

### Using Postman:
1. Method: **POST**
2. URL: `http://localhost:3000/api/auth/login`
3. Body:
   ```json
   {
     "email": "john@example.com",
     "password": "wrongpassword"
   }
   ```
4. **Expected Response (401):**
   ```json
   {
     "error": "Invalid email/username or password"
   }
   ```

---

## Test 9: Get Current User (Protected Route) - WITH Token

### Using Postman:
1. Method: **GET**
2. URL: `http://localhost:3000/api/auth/me`
3. Headers:
   - `Authorization: Bearer <your_token_here>`
   - Replace `<your_token_here>` with the token from Test 1 or Test 6
4. **Expected Response (200):**
   ```json
   {
     "user": {
       "id": 1,
       "username": "johndoe",
       "email": "john@example.com",
       "created_at": "2026-01-20T12:00:00.000Z"
     }
   }
   ```

### Using PowerShell:
```powershell
$token = "your_token_here"  # Use token from Test 1 or Test 6

$headers = @{
    Authorization = "Bearer $token"
}

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" `
    -Method Get `
    -Headers $headers

$response | ConvertTo-Json -Depth 10
```

---

## Test 10: Get Current User (Protected Route) - WITHOUT Token

### Using Postman:
1. Method: **GET**
2. URL: `http://localhost:3000/api/auth/me`
3. **Don't add Authorization header**
4. **Expected Response (401):**
   ```json
   {
     "error": "Access token required"
   }
   ```

### Using PowerShell:
```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" `
        -Method Get `
        -ErrorAction Stop
} catch {
    Write-Host "Error (expected): $($_.Exception.Message)"
    # Should return 401 status
}
```

---

## Test 11: Get Current User (Protected Route) - WITH Invalid Token

### Using Postman:
1. Method: **GET**
2. URL: `http://localhost:3000/api/auth/me`
3. Headers:
   - `Authorization: Bearer invalid.token.here`
4. **Expected Response (403):**
   ```json
   {
     "error": "Invalid or expired token"
   }
   ```

---

## Test 12: Health Check (Bonus)

### Using Browser:
Just open: `http://localhost:3000/health`

### Using PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## Quick Test Checklist

- [ ] Register new user (201)
- [ ] Register with duplicate email (400)
- [ ] Register with duplicate username (400)
- [ ] Register with invalid password (400)
- [ ] Register with invalid email (400)
- [ ] Login with email (200)
- [ ] Login with username (200)
- [ ] Login with wrong password (401)
- [ ] Get /api/auth/me with valid token (200)
- [ ] Get /api/auth/me without token (401)
- [ ] Get /api/auth/me with invalid token (403)
- [ ] Health check (200)

---

## Notes

- **Frontend Testing:** Frontend integration will be built in Phase 6. For now, we're only testing the backend API.
- **Token Storage:** Save tokens from registration/login responses for testing protected routes.
- **Error Codes:** 
  - `200` = Success
  - `201` = Created
  - `400` = Bad Request (validation errors)
  - `401` = Unauthorized (missing/invalid credentials)
  - `403` = Forbidden (invalid token)
  - `500` = Server Error

---

## Troubleshooting

**Server not running?**
```powershell
cd backend
npm start
```

**Port already in use?**
- Check if another process is using port 3000
- Or change PORT in `.env` file

**Database errors?**
- Make sure `database.sqlite` exists in the backend folder
- Server will create it automatically on first run

**CORS errors?**
- Make sure backend CORS is configured for `http://localhost:3001` (for future frontend)
- Postman/curl won't have CORS issues

