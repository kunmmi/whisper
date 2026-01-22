/**
 * API service layer
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get base server URL (without /api)
export const getServerBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '');
  }
  return 'http://localhost:3000';
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  search: (username) => api.get(`/users/search?username=${encodeURIComponent(username)}`),
  getOnlineStatus: (userId) => api.get(`/users/online-status/${userId}`),
  getOnlineStatuses: (userIds) => api.get(`/users/online-status?userIds=${userIds.join(',')}`),
  updateProfilePicture: (profilePictureUrl) => api.put('/users/profile-picture', { profile_picture_url: profilePictureUrl }),
};

// Chat API
export const chatAPI = {
  createPrivate: (username) => api.post('/chats/private', { username }),
  createGroup: (data) => api.post('/chats/group', data),
  getAll: () => api.get('/chats'),
  addUser: (chatId, username) => api.post(`/chats/${chatId}/add-user`, { username }),
  removeUser: (chatId, username) => api.post(`/chats/${chatId}/remove-user`, { username }),
  leave: (chatId) => api.post(`/chats/${chatId}/leave`),
  rename: (chatId, name) => api.put(`/chats/${chatId}/rename`, { name }),
  delete: (chatId) => api.delete(`/chats/${chatId}`),
};

// Message API
export const messageAPI = {
  getMessages: (chatId, limit = 50, offset = 0) =>
    api.get(`/messages/${chatId}?limit=${limit}&offset=${offset}`),
  sendMessage: (chatId, content, replyToMessageId = null, mediaUrl = null, mediaType = null) => 
    api.post(`/messages/${chatId}`, { 
      content, 
      reply_to_message_id: replyToMessageId,
      media_url: mediaUrl,
      media_type: mediaType
    }),
  markAsRead: (chatId) => api.post(`/messages/${chatId}/read`),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadAudio: (file) => {
    const formData = new FormData();
    formData.append('audio', file);
    
    return api.post('/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadVideo: (file) => {
    const formData = new FormData();
    formData.append('video', file);
    
    return api.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;

