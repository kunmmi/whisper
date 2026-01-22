/**
 * Socket.IO service
 * Manages WebSocket connection for real-time messaging
 */

import { io } from 'socket.io-client';

// Get socket URL from environment or construct from API URL
const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  // If API URL is set, derive socket URL from it
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Remove /api from the end if present
    return apiUrl.replace('/api', '');
  }
  // Default to localhost for development
  return 'http://localhost:3000';
};

const SOCKET_URL = getSocketURL();

let socket = null;

/**
 * Initialize socket connection
 * @param {string} token - JWT token for authentication
 * @returns {Socket} Socket instance
 */
export function initSocket(token) {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
  });

  return socket;
}

/**
 * Get current socket instance
 * @returns {Socket|null} Socket instance or null
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
};

