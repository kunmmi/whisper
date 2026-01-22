/**
 * Create Group Modal Component
 * Modal for creating a new group chat
 */

import { useState, useEffect } from 'react';
import { chatAPI, userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import { MicroExpander } from './ui/micro-expander';
import { Users, X } from 'lucide-react';

export default function CreateGroupModal({ isOpen, onClose }) {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Search users when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await userAPI.search(searchTerm);
      // Filter out users that are already selected
      const filtered = (response.data.users || []).filter(
        (user) => !selectedUsers.find((su) => su.id === user.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to search users');
      setSearchResults([]);
    }

    setLoading(false);
  };

  const addUser = (user) => {
    if (selectedUsers.length >= 49) {
      setError('Group cannot have more than 50 members (including you)');
      return;
    }
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (groupName.trim().length < 3 || groupName.trim().length > 50) {
      setError('Group name must be between 3 and 50 characters');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please add at least one member to the group');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const usernames = selectedUsers.map((u) => u.username);
      const response = await chatAPI.createGroup({
        name: groupName.trim(),
        usernames,
      });

      // Reset form
      setGroupName('');
      setSelectedUsers([]);
      setSearchTerm('');
      setSearchResults([]);

      // Close modal and navigate to the new group chat
      onClose();
      navigate(`/chat/${response.data.chat.id}`);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedUsers([]);
    setSearchTerm('');
    setSearchResults([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Group Chat</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Group Name
            </label>
            <input
              id="groupName"
              name="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name (3-50 characters)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              disabled={creating}
              maxLength={50}
            />
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected Members ({selectedUsers.length}/49)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                  >
                    <Avatar user={user} size={20} className="mr-2" />
                    <span>{user.username}</span>
                    <button
                      type="button"
                      onClick={() => removeUser(user.id)}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold"
                      disabled={creating}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Search */}
          <div className="mb-4">
            <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Members
            </label>
            <input
              id="userSearch"
              name="userSearch"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for users..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              disabled={creating || selectedUsers.length >= 49}
            />

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-md max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addUser(user)}
                    className="w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center text-left"
                    disabled={creating}
                  >
                    <Avatar user={user} size={32} className="mr-3" />
                    <span className="text-sm dark:text-gray-200">{user.username}</span>
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">Searching...</div>
            )}

            {searchTerm && !loading && searchResults.length === 0 && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                No users found
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <MicroExpander
              type="button"
              text="Cancel"
              variant="outline"
              icon={<X className="w-5 h-5" />}
              onClick={handleClose}
              disabled={creating}
              className="flex-1"
            />
            <MicroExpander
              type="submit"
              text={creating ? 'Creating' : 'Create Group'}
              variant="default"
              icon={<Users className="w-5 h-5" />}
              isLoading={creating}
              disabled={creating || !groupName.trim() || selectedUsers.length === 0}
              className="flex-1"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

