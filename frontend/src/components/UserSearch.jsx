/**
 * User Search Component
 * Search for users and start chats with them
 */

import { useState, useEffect } from 'react';
import { userAPI, chatAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';

export default function UserSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await userAPI.search(searchTerm);
      setUsers(response.data.users || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to search users');
      setUsers([]);
    }

    setLoading(false);
  };

  const startChat = async (username) => {
    try {
      const response = await chatAPI.createPrivate(username);
      navigate(`/chat/${response.data.chat.id}`);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to start chat');
    }
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          id="userSearch"
          name="userSearch"
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}

      {users.length > 0 && (
        <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => startChat(user.username)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
            >
              <div className="flex items-center">
                <Avatar user={user} size={32} className="mr-3" />
                <span className="font-medium dark:text-gray-100">{user.username}</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Start chat</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

