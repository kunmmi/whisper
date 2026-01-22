/**
 * Authentication controller
 * Handles user registration, login, and authentication
 */

const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateToken } = require('../config/jwt');

/**
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { email, username, password } = req.body;

    // Check if email already exists
    if (User.emailExists(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if username already exists
    if (User.usernameExists(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = User.createUser(username, email, passwordHash);

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token (exclude password_hash)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

/**
 * Login user
 * POST /api/auth/login
 * Can login with either email or username
 */
async function login(req, res) {
  try {
    const { password } = req.body;
    const identifier = req.loginIdentifier; // Set by validateLogin middleware

    if (!identifier) {
      console.error('Login error: req.loginIdentifier is undefined');
      return res.status(400).json({ error: 'Email/username is required' });
    }

    // Find user by email or username
    const user = User.findByEmailOrUsername(identifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    if (!user.password_hash) {
      console.error('Login error: user.password_hash is missing for user:', user.id);
      return res.status(500).json({ error: 'User data error' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    });

    // Return user data and token (exclude password_hash)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_picture_url: user.profile_picture_url || null,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
}

/**
 * Get current user info
 * GET /api/auth/me
 * Requires authentication middleware
 */
function getMe(req, res) {
  try {
    // User is attached to req by auth middleware
    const user = req.user;

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
}

module.exports = {
  register,
  login,
  getMe
};

