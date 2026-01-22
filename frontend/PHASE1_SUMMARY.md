# Phase 1 — Authentication System — Complete ✅

## What Was Built

### Database
- ✅ Created `users` table with columns:
  - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
  - `username` (TEXT UNIQUE NOT NULL)
  - `email` (TEXT UNIQUE NOT NULL)
  - `password_hash` (TEXT NOT NULL)
  - `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- ✅ Created indexes on `username` and `email` for performance
- ✅ Database initialization runs automatically on server start

### User Model (`/src/models/User.js`)
- ✅ `createUser()` - Create new user with hashed password
- ✅ `findByEmail()` - Find user by email
- ✅ `findByUsername()` - Find user by username
- ✅ `findById()` - Find user by ID (returns without password_hash)
- ✅ `findByEmailOrUsername()` - Find user by email or username (for login)
- ✅ `emailExists()` - Check if email exists
- ✅ `usernameExists()` - Check if username exists

### Validation Middleware (`/src/middleware/validation.js`)
- ✅ Email validation (format check)
- ✅ Password validation:
  - Minimum 8 characters
  - At least 1 letter
  - At least 1 number
- ✅ Username validation:
  - 3-20 characters
  - Letters, numbers, underscore only
- ✅ `validateRegister()` - Middleware for registration
- ✅ `validateLogin()` - Middleware for login

### JWT Configuration (`/src/config/jwt.js`)
- ✅ Token generation with 7-day expiration
- ✅ Token verification
- ✅ Uses JWT_SECRET from environment variables

### Authentication Middleware (`/src/middleware/auth.js`)
- ✅ `authenticateToken()` - Verifies JWT tokens
- ✅ Extracts token from Authorization header
- ✅ Attaches user to `req.user` for protected routes

### Auth Controller (`/src/controllers/authController.js`)
- ✅ `register()` - Register new user
  - Validates email/username uniqueness
  - Hashes password with bcrypt
  - Returns user data and JWT token
- ✅ `login()` - Login user
  - Accepts email OR username
  - Verifies password
  - Returns user data and JWT token
- ✅ `getMe()` - Get current user info (protected route)

### Auth Routes (`/src/routes/authRoutes.js`)
- ✅ POST `/api/auth/register` - Register new user
- ✅ POST `/api/auth/login` - Login user
- ✅ GET `/api/auth/me` - Get current user (protected)

## API Endpoints

### POST `/api/auth/register`
**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "created_at": "2026-01-20T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Validation errors (invalid email, weak password, etc.)
- `400` - Email or username already exists
- `500` - Server error

### POST `/api/auth/login`
**Request Body (with email):**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Request Body (with username):**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "created_at": "2026-01-20T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing email/username or password
- `401` - Invalid credentials
- `500` - Server error

### GET `/api/auth/me`
**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "user@example.com",
    "created_at": "2026-01-20T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token
- `403` - Token expired or user not found
- `500` - Server error

## How to Test

### 1. Start the Backend Server
```bash
cd backend
npm start
```

### 2. Test Registration

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
```

**Using PowerShell:**
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/auth/register `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","username":"testuser","password":"password123"}'
```

**Using Postman:**
- Method: POST
- URL: `http://localhost:3000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }
  ```

### 3. Test Login

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Or with username:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### 4. Test Protected Route (Get Me)

**Using curl:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

**Using PowerShell:**
```powershell
$token = "your_token_here"
Invoke-RestMethod -Uri http://localhost:3000/api/auth/me `
  -Method Get `
  -Headers @{Authorization = "Bearer $token"}
```

### 5. Test Validation Errors

**Invalid email:**
```json
{
  "email": "notanemail",
  "username": "testuser",
  "password": "password123"
}
```

**Weak password:**
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "123"
}
```

**Invalid username:**
```json
{
  "email": "test@example.com",
  "username": "ab",
  "password": "password123"
}
```

**Duplicate email:**
```json
{
  "email": "test@example.com",
  "username": "anotheruser",
  "password": "password123"
}
```

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── jwt.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── initDb.js
│   │   └── User.js
│   ├── routes/
│   │   └── authRoutes.js
│   └── server.js
├── database.sqlite
├── .env
└── package.json
```

## Next Steps

Phase 1 is complete! Ready to proceed to **Phase 2 — User Search**.

All authentication endpoints are working and tested. Users can now:
- Register with email, username, and password
- Login with email OR username
- Access protected routes using JWT tokens

