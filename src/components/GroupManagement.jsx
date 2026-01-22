/**
 * Group Management Component
 * Allows admins to manage group members and rename group
 */

import { useState } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import { MicroExpander } from './ui/micro-expander';
import { UserPlus, Edit, LogOut, X } from 'lucide-react';

export default function GroupManagement({ chat, onClose, onUpdate }) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [username, setUsername] = useState('');
  const [newName, setNewName] = useState(chat.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const isAdmin = chat.members.find((m) => m.id === user?.id)?.role === 'admin';

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await chatAPI.addUser(chat.id, username.trim());
      setSuccess('User added successfully');
      setUsername('');
      setShowAddUser(false);
      // Refresh chat data
      if (onUpdate) {
        onUpdate();
      } else {
        window.location.reload();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (usernameToRemove) => {
    if (!confirm(`Remove ${usernameToRemove} from the group?`)) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await chatAPI.removeUser(chat.id, usernameToRemove);
      setSuccess('User removed successfully');
      if (onUpdate) {
        onUpdate();
      } else {
        window.location.reload();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await chatAPI.rename(chat.id, newName.trim());
      setSuccess('Group renamed successfully');
      setShowRename(false);
      if (onUpdate) {
        onUpdate();
      } else {
        window.location.reload();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to rename group');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this group?')) return;

    try {
      await chatAPI.leave(chat.id);
      window.location.href = '/chat';
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to leave group');
    }
  };

  if (!chat.is_group) return null;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-blue-700 dark:border-blue-600">
        <div>
          <h2 className="text-xl font-semibold">{chat.name || 'Group Chat'}</h2>
          <p className="text-sm text-blue-100 mt-1">{chat.members.length} members</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4 space-y-4 md:space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded">
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Members Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Members</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {chat.members.length}
            </span>
          </div>
          <div className="space-y-3">
            {chat.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <Avatar user={member} size={40} className="mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {member.username}
                      </span>
                      {member.id === user?.id && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs rounded-full font-medium">
                          You
                        </span>
                      )}
                    </div>
                    {member.role === 'admin' && (
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-blue-600 dark:bg-blue-700 text-white text-xs rounded-full font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && member.id !== user?.id && (
                  <MicroExpander
                    text="Remove"
                    variant="destructive"
                    icon={<X className="w-4 h-4" />}
                    onClick={() => handleRemoveUser(member.username)}
                    disabled={loading}
                    isLoading={loading}
                    className="ml-3 text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Admin Actions</h3>
              
              {/* Add User */}
              <div className="mb-4">
                {!showAddUser ? (
                  <MicroExpander
                    text="Add Member"
                    variant="default"
                    icon={<UserPlus className="w-5 h-5" />}
                    onClick={() => setShowAddUser(true)}
                    className="w-full"
                  />
                ) : (
                  <form onSubmit={handleAddUser} className="space-y-3">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      disabled={loading}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <MicroExpander
                        type="submit"
                        text="Add"
                        variant="default"
                        icon={<UserPlus className="w-5 h-5" />}
                        isLoading={loading}
                        disabled={loading || !username.trim()}
                        className="flex-1"
                      />
                      <MicroExpander
                        type="button"
                        text="Cancel"
                        variant="outline"
                        icon={<X className="w-5 h-5" />}
                        onClick={() => {
                          setShowAddUser(false);
                          setUsername('');
                        }}
                        disabled={loading}
                      />
                    </div>
                  </form>
                )}
              </div>

              {/* Rename Group */}
              <div>
                {!showRename ? (
                  <MicroExpander
                    text="Rename Group"
                    variant="ghost"
                    icon={<Edit className="w-5 h-5" />}
                    onClick={() => setShowRename(true)}
                    className="w-full"
                  />
                ) : (
                  <form onSubmit={handleRename} className="space-y-3">
                    <input
                      id="renameGroup"
                      name="renameGroup"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter new group name"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      disabled={loading}
                      autoFocus
                      maxLength={50}
                    />
                    <div className="flex space-x-2">
                      <MicroExpander
                        type="submit"
                        text="Save"
                        variant="default"
                        icon={<Edit className="w-5 h-5" />}
                        isLoading={loading}
                        disabled={loading || !newName.trim()}
                        className="flex-1"
                      />
                      <MicroExpander
                        type="button"
                        text="Cancel"
                        variant="outline"
                        icon={<X className="w-5 h-5" />}
                        onClick={() => {
                          setShowRename(false);
                          setNewName(chat.name || '');
                        }}
                        disabled={loading}
                      />
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leave Group */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <MicroExpander
            text="Leave Group"
            variant="destructive"
            icon={<LogOut className="w-5 h-5" />}
            onClick={handleLeave}
            disabled={loading}
            isLoading={loading}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

