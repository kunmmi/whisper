/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user to request object
 */

const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header, verifies it, and attaches user to req.user
 */
function authenticateToken(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify token
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Get user from database
  const user = User.findById(decoded.id);

  if (!user) {
    return res.status(403).json({ error: 'User not found' });
  }

  // Attach user to request object
  req.user = user;
  next();
}

module.exports = {
  authenticateToken
};

