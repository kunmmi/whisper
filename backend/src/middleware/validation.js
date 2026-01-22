/**
 * Validation middleware
 * Validates user input for registration and login
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: Min 8 characters, at least 1 letter, at least 1 number
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, error: string }
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Validate username
 * Requirements: 3-20 characters, letters/numbers/underscore only
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, error: string }
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  if (username.length < 3 || username.length > 20) {
    return { valid: false, error: 'Username must be between 3 and 20 characters' };
  }

  // Only letters, numbers, and underscores allowed
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  return { valid: true };
}

/**
 * Middleware to validate registration data
 * Validates email, username, and password
 */
function validateRegister(req, res, next) {
  const { email, username, password } = req.body;

  // Check all fields are provided
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate username
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return res.status(400).json({ error: usernameValidation.error });
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.error });
  }

  next();
}

/**
 * Middleware to validate login data
 * Validates that identifier (email or username) and password are provided
 */
function validateLogin(req, res, next) {
  const { email, username, password } = req.body;

  // User can login with either email or username
  const identifier = email || username;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/username and password are required' });
  }

  // Store identifier in req for controller to use
  req.loginIdentifier = identifier;
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  isValidEmail,
  validatePassword,
  validateUsername
};

