/**
 * Chat Window Component
 * Displays messages and allows sending messages in real-time
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { messageAPI, chatAPI, uploadAPI } from '../services/api';
import { getSocket } from '../services/socket';
import GroupManagement from '../components/GroupManagement';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import DarkModeToggle from '../components/DarkModeToggle';
import { ArrowLeft } from 'lucide-react';

export default function ChatWindow() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Voice recording hook
  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    formatTime
  } = useVoiceRecorder();

  useEffect(() => {
    loadChat();
    loadMessages();
    markMessagesAsRead();
    const cleanup = setupSocket();

    return () => {
      // Cleanup typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Cleanup socket listeners
      if (cleanup) {
        cleanup();
      }
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChat = async () => {
    try {
      const response = await chatAPI.getAll();
      const foundChat = response.data.chats.find((c) => c.id === parseInt(chatId));
      if (foundChat) {
        setChat(foundChat);
      } else {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
      navigate('/dashboard');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages(chatId);
      setMessages(response.data.messages || []);
      // Messages are automatically marked as read when fetched
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await messageAPI.markAsRead(chatId);
      // Refresh chat list to update unread counts
      // This will be handled by the dashboard when user navigates back
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    if (!socket) return () => {};

    // Remove any existing listeners first to prevent duplicates
    socket.off('joined_chat');
    socket.off('receive_message');
    socket.off('user_typing');
    socket.off('user_stopped_typing');

    // Join chat room
    socket.emit('join_chat', { chatId: parseInt(chatId) });
    
    // Handler for join confirmation
    const handleJoinedChat = (data) => {
      if (data.chatId === parseInt(chatId)) {
        console.log('Successfully joined chat:', chatId);
      }
    };

    // Handler for new messages
    const handleReceiveMessage = (message) => {
      if (message.chatId === parseInt(chatId)) {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        
        // Mark as read if message is not from current user (since chat window is open)
        if (message.sender.id !== user?.id) {
          messageAPI.markAsRead(chatId).catch(err => console.error('Failed to mark as read:', err));
        }
      }
    };

    // Handler for typing indicators
    const handleUserTyping = (data) => {
      if (data.chatId === parseInt(chatId)) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.id === data.user.id)) {
            return [...prev, data.user];
          }
          return prev;
        });

        // Auto-clear typing after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.id !== data.user.id));
        }, 3000);
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.chatId === parseInt(chatId)) {
        setTypingUsers((prev) => prev.filter((u) => u.id !== data.user.id));
      }
    };

    // Register event listeners
    socket.on('joined_chat', handleJoinedChat);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    // Return cleanup function
    return () => {
      socket.off('joined_chat', handleJoinedChat);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const response = await uploadAPI.uploadImage(file);
      const serverBaseURL = getServerBaseURL();
      const imageUrl = response.data.url.startsWith('http') 
        ? response.data.url 
        : `${serverBaseURL}${response.data.url}`;
      
      // Send message with image
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('send_message', {
          chatId: parseInt(chatId),
          content: '', // Optional caption
          media_url: imageUrl,
          media_type: 'image'
        });
      } else {
        // Fallback to REST API
        await messageAPI.sendMessage(chatId, '', null, imageUrl, 'image');
        loadMessages();
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendVoiceNote = async () => {
    if (!audioBlob) return;

    try {
      setUploadingAudio(true);
      // Convert blob to file with proper extension based on mime type
      const blobType = audioBlob.type || 'audio/webm';
      let extension = '.webm';
      if (blobType.includes('mp4')) extension = '.m4a';
      else if (blobType.includes('ogg')) extension = '.ogg';
      else if (blobType.includes('wav')) extension = '.wav';
      
      const audioFile = new File([audioBlob], `voice-${Date.now()}${extension}`, {
        type: blobType
      });

      const response = await uploadAPI.uploadAudio(audioFile);
      const serverBaseURL = getServerBaseURL();
      const uploadedAudioUrl = response.data.url.startsWith('http') 
        ? response.data.url 
        : `${serverBaseURL}${response.data.url}`;

      // Send message with audio
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('send_message', {
          chatId: parseInt(chatId),
          content: '',
          media_url: uploadedAudioUrl,
          media_type: 'audio'
        });
      } else {
        // Fallback to REST API
        await messageAPI.sendMessage(chatId, '', null, uploadedAudioUrl, 'audio');
        loadMessages();
      }

      // Reset recording
      cancelRecording();
    } catch (error) {
      console.error('Failed to upload voice note:', error);
      alert(error.response?.data?.error || 'Failed to upload voice note');
    } finally {
      setUploadingAudio(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const socket = getSocket();
    if (socket && socket.connected) {
      // Send via Socket.IO for real-time
      socket.emit('send_message', {
        chatId: parseInt(chatId),
        content: content,
      });
    } else {
      // Fallback to REST API
      try {
        await messageAPI.sendMessage(chatId, content);
        loadMessages();
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }

    setSending(false);
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;

    socket.emit('typing_start', { chatId: parseInt(chatId) });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { chatId: parseInt(chatId) });
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChatName = () => {
    if (!chat) return 'Loading...';
    if (chat.is_group) {
      return chat.name || 'Group Chat';
    }
    return chat.other_participant?.username || 'Unknown User';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Back to chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <DarkModeToggle />
        </div>
        {chat && chat.is_group && (
          <div className="p-4">
            <GroupManagement chat={chat} />
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/chat')}
              className="md:hidden mr-2 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to chats"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg md:text-xl font-semibold dark:text-white">{getChatName()}</h2>
              {chat && chat.is_group && (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{chat.members.length} members</p>
              )}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender.id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 text-sm md:text-base rounded-lg ${
                      message.sender.id === user?.id
                        ? 'bg-blue-600 dark:bg-blue-700 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1 dark:text-gray-200">
                      {message.sender.id === user?.id ? 'You' : message.sender.username}
                    </div>
                    {/* Media display */}
                    {message.media && message.media.type === 'image' && (
                      <div className="mb-2">
                        <img 
                          src={message.media.url} 
                          alt="Shared image" 
                          className="max-w-full max-h-64 rounded-lg cursor-pointer"
                          onClick={() => window.open(message.media.url, '_blank')}
                        />
                      </div>
                    )}
                    {message.media && message.media.type === 'audio' && (
                      <div className="mb-2">
                        <audio 
                          src={message.media.url} 
                          controls 
                          className="max-w-full"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                    {message.media && message.media.type === 'video' && (
                      <div className="mb-2">
                        <video 
                          src={message.media.url} 
                          controls 
                          className="max-w-full max-h-64 rounded-lg"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}
                    {message.content && (
                      <div className="text-sm">{message.content}</div>
                    )}
                    <div
                      className={`text-xs mt-1 ${
                        message.sender.id === user?.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {typingUsers.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  {typingUsers.map((u) => u.username).join(', ')} typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 md:px-6 py-3 md:py-4">
          {/* Voice Recording UI */}
          {isRecording ? (
            <div className="mb-2 flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Recording: {formatTime(recordingTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={stopRecording}
                  className="px-4 py-1.5 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 text-sm font-medium"
                >
                  Stop
                </button>
                <button
                  onClick={cancelRecording}
                  className="px-4 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : audioUrl ? (
            <div className="mb-2 flex items-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <audio src={audioUrl} controls className="flex-1" />
              <button
                onClick={handleSendVoiceNote}
                disabled={uploadingAudio}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {uploadingAudio ? 'Sending...' : 'Send'}
              </button>
              <button
                onClick={cancelRecording}
                className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : null}
          
          <form onSubmit={sendMessage} className="flex space-x-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
              id="image-upload"
              disabled={uploadingImage || isRecording}
            />
            <label
              htmlFor="image-upload"
              className={`px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer flex items-center disabled:opacity-50 ${
                uploadingImage || isRecording ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Upload image"
            >
              📷
            </label>
            <button
              type="button"
              onClick={startRecording}
              disabled={isRecording || uploadingAudio}
              className={`px-4 py-2 rounded-lg flex items-center ${
                isRecording 
                  ? 'bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300 cursor-not-allowed' 
                  : 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600'
              } disabled:opacity-50`}
              title="Record voice note"
            >
              🎤
            </button>
            <input
              id="message-input"
              name="message"
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              disabled={sending || uploadingImage || uploadingAudio || isRecording}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || uploadingImage || uploadingAudio || isRecording}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending || uploadingImage || uploadingAudio ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

