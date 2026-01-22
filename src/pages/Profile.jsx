/**
 * Profile Page
 * Allows users to view and update their profile information
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import Avatar from '../components/Avatar';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profile_picture_url || '');

  // Update state when user changes
  useEffect(() => {
    setProfilePictureUrl(user?.profile_picture_url || '');
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'file'
  const fileInputRef = useRef(null);

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await userAPI.updateProfilePicture(profilePictureUrl || null);
      setSuccess('Profile picture updated successfully!');
      // Update local user data
      if (response.data.user) {
        // Update state immediately
        setProfilePictureUrl(response.data.user.profile_picture_url || '');
        if (updateUser) {
          await updateUser();
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Compress image before converting to base64
      const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              // Calculate new dimensions
              if (width > height) {
                if (width > maxWidth) {
                  height = (height * maxWidth) / width;
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = (width * maxHeight) / height;
                  height = maxHeight;
                }
              }

              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error('Failed to compress image'));
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                },
                file.type,
                quality
              );
            };
            img.onerror = reject;
            img.src = e.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      // Compress and convert to base64
      const base64String = await compressImage(file);
      
      const response = await userAPI.updateProfilePicture(base64String);
      setSuccess('Profile picture updated successfully!');
      // Update state immediately with the base64 string
      setProfilePictureUrl(base64String);
      // Update local user data
      if (response.data.user) {
        // Also update from response in case backend returns it
        if (response.data.user.profile_picture_url) {
          setProfilePictureUrl(response.data.user.profile_picture_url);
        }
        if (updateUser) {
          await updateUser();
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('File upload error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to process image');
      setLoading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!confirm('Remove your profile picture?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await userAPI.updateProfilePicture(null);
      setSuccess('Profile picture removed successfully!');
      setProfilePictureUrl('');
      if (response.data.user && updateUser) {
        await updateUser();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to remove profile picture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-blue-600 dark:bg-blue-700 text-white px-4 md:px-6 py-3 md:py-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/chat')}
              className="mr-4 text-white hover:text-gray-200"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semibold">My Profile</h1>
          </div>
          <div className="flex items-center space-x-2">
            <DarkModeToggle />
            <button
              onClick={logout}
              className="px-4 py-2 bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-500 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          {/* Profile Picture Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Picture</h2>
            
            {/* Current Avatar Preview */}
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex-shrink-0">
                <Avatar 
                  key={`profile-${user?.id}-${profilePictureUrl || user?.profile_picture_url || 'default'}`}
                  user={{ ...user, profile_picture_url: profilePictureUrl || user?.profile_picture_url }} 
                  size={120} 
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your profile picture appears in chats and next to your messages.
                </p>
                {user?.profile_picture_url && (
                  <button
                    onClick={handleRemovePicture}
                    disabled={loading}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    Remove picture
                  </button>
                )}
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded">
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            {/* Upload Method Tabs */}
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <button
                  onClick={() => setUploadMethod('url')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    uploadMethod === 'url'
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  From URL
                </button>
                <button
                  onClick={() => setUploadMethod('file')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    uploadMethod === 'file'
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {/* URL Input Method */}
            {uploadMethod === 'url' && (
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label htmlFor="profileUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL
                  </label>
                  <input
                    id="profileUrl"
                    name="profileUrl"
                    type="url"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter a direct link to an image (JPG, PNG, GIF)
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? 'Updating...' : 'Update Picture'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfilePictureUrl('')}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </form>
            )}

            {/* File Upload Method */}
            {uploadMethod === 'file' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="profileFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Image
                  </label>
                  <input
                    id="profileFile"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full px-6 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 text-center"
                  >
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {loading ? 'Processing...' : 'Choose Image File'}
                    </span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG, or GIF (max 2MB)
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Information Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Username cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Member Since
                </label>
                <input
                  type="text"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

