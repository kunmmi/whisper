/**
 * Avatar utility functions
 * Generates avatar URLs and colors from usernames
 */

/**
 * Generate a consistent color from a string (username)
 * @param {string} str - String to generate color from
 * @returns {string} Hex color code
 */
export function getAvatarColor(str) {
  if (!str || typeof str !== 'string') {
    str = 'User';
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a color with good contrast
  const hue = hash % 360;
  const saturation = 65 + (hash % 20); // 65-85%
  const lightness = 50 + (hash % 15); // 50-65%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Get initials from a username
 * @param {string} username - Username
 * @returns {string} Initials (1-2 characters)
 */
export function getInitials(username) {
  if (!username) return '?';
  
  const parts = username.trim().split(/[\s_-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
}

/**
 * Generate an SVG data URL for an avatar
 * @param {string} username - Username
 * @param {number} size - Size in pixels (default: 40)
 * @returns {string} SVG data URL
 */
export function generateAvatarSVG(username, size = 40) {
  if (!username || typeof username !== 'string') {
    username = 'User';
  }
  const initials = getInitials(username);
  const color = getAvatarColor(username);
  const fontSize = Math.floor(size * 0.4);
  
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
  
  // Use encodeURIComponent for better browser compatibility
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Get avatar URL for a user
 * @param {Object} user - User object with profile_picture_url and username
 * @param {number} size - Size in pixels (default: 40)
 * @param {number} cacheBust - Optional timestamp for cache-busting
 * @returns {string} Avatar URL (either profile picture or generated SVG)
 */
export function getAvatarUrl(user, size = 40, cacheBust = null) {
  if (user?.profile_picture_url) {
    const url = user.profile_picture_url;
    // Ensure URL is not empty
    if (!url || url.trim() === '') {
      return generateAvatarSVG(user?.username || 'User', size);
    }
    // If it's a data URL (base64), return as-is
    if (url.startsWith('data:')) {
      return url;
    }
    // Add cache-busting parameter for external URLs if provided
    if (cacheBust && !url.includes('?')) {
      return `${url}?t=${cacheBust}`;
    }
    return url;
  }
  return generateAvatarSVG(user?.username || 'User', size);
}

