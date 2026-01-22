/**
 * Authentication routes
 * Handles user registration, login, and authentication endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { email, username, password }
 */
router.post('/register', validateRegister, authController.register);

/**
 * POST /api/auth/login
 * Login user (can use email or username)
 * Body: { email/username, password }
 */
router.post('/login', validateLogin, authController.login);

/**
 * GET /api/auth/me
 * Get current authenticated user info
 * Requires: Authorization header with Bearer token
 */
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;

