/**
 * Avatar Component
 * Displays user profile picture or generated avatar with initials
 */

import { useState, useEffect } from 'react';
import { getAvatarUrl } from '../utils/avatar';

export default function Avatar({ user, size = 40, className = '' }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgKey, setImgKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setImgSrc(null);
      return;
    }

    const profilePicUrl = user.profile_picture_url || '';
    const timestamp = profilePicUrl ? Date.now() : null;
    const avatarUrl = getAvatarUrl(user, size, timestamp);
    
    // Update image source - ensure it's never an empty string
    // Convert empty string to null
    const finalUrl = avatarUrl && avatarUrl.trim() !== '' ? avatarUrl : null;
    setImgSrc(finalUrl);
    
    // Force re-render by updating key when profile picture changes
    // This helps with cache-busting and ensures the image reloads
    if (profilePicUrl) {
      // Use profile picture URL hash + timestamp to force refresh
      const urlHash = profilePicUrl.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '');
      setImgKey(`${urlHash}-${timestamp}`);
    } else {
      setImgKey(0);
    }
  }, [user?.id, user?.profile_picture_url, user?.username, size]);

  if (!user) {
    return null;
  }

  // If no image source yet, show fallback
  if (!imgSrc) {
    const fallbackUrl = getAvatarUrl(user, size);
    return (
      <div 
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img
          src={fallbackUrl}
          alt={user?.username || 'User'}
          className="w-full h-full object-cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  try {
    const username = user?.username || 'User';

    return (
      <div 
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img
          key={imgKey}
          src={imgSrc || undefined}
          alt={username}
          className="w-full h-full object-cover"
          style={{ width: '100%', height: '100%' }}
          onError={(e) => {
            // Fallback to generated avatar if image fails to load
            try {
              const fallbackUrl = getAvatarUrl({ username }, size);
              // Ensure we don't set empty string
              if (fallbackUrl && fallbackUrl.trim() !== '' && e.target.src !== fallbackUrl) {
                e.target.src = fallbackUrl;
              }
            } catch (err) {
              console.error('Avatar error fallback failed:', err);
            }
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('Avatar component error:', error);
    // Return a simple fallback div
    return (
      <div 
        className={`rounded-full overflow-hidden flex-shrink-0 bg-gray-400 flex items-center justify-center ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <span className="text-white text-xs font-bold">?</span>
      </div>
    );
  }
}

