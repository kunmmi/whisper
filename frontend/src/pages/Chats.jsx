/**
 * Main Chats Page
 * WhatsApp-style layout with chat list on left and chat window on right
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI, messageAPI, userAPI, uploadAPI, getServerBaseURL } from '../services/api';
import { getSocket } from '../services/socket';
import UserSearch from '../components/UserSearch';
import GroupManagement from '../components/GroupManagement';
import Avatar from '../components/Avatar';
import CreateGroupModal from '../components/CreateGroupModal';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import DarkModeToggle from '../components/DarkModeToggle';
import { MicroExpander } from '../components/ui/micro-expander';
import { MessageCircle, Send, Heart, Share2, Users, Mic, Paperclip, Info, X, LogOut, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function Chats() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [selectedMedia, setSelectedMedia] = useState(null); // { file, preview, type }
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [newMessageIndicators, setNewMessageIndicators] = useState(new Set()); // Track chats with new messages
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Track online user IDs
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null); // Track which chat's menu is open
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user, logout } = useAuth();
  
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
    loadChats();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any menu container
      const menuElement = event.target.closest('[data-menu-container]');
      if (!menuElement && openMenuId !== null) {
        setOpenMenuId(null);
      }
      // Close emoji picker if clicking outside
      const emojiPickerElement = event.target.closest('.epr-emoji-picker, [data-emoji-picker]');
      const emojiButton = event.target.closest('button[data-emoji-button]');
      if (!emojiPickerElement && !emojiButton && showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    };

    if (openMenuId !== null || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId, showEmojiPicker]);

  // Setup socket listeners for online/offline events
  useEffect(() => {
    const setupSocketListeners = () => {
      const socket = getSocket();
      if (!socket) {
        console.log('Socket not available, retrying...');
        setTimeout(setupSocketListeners, 500);
        return;
      }

      if (!socket.connected) {
        console.log('Socket not connected, waiting...');
        socket.on('connect', () => {
          console.log('Socket connected, setting up listeners');
          setupListeners(socket);
        });
        return;
      }

      console.log('Setting up online status listeners');
      return setupListeners(socket);
    };

    return setupSocketListeners();
  }, []);

  const setupListeners = (socket) => {
    const handleUserOnline = (data) => {
      if (data?.userId) {
        console.log(`User ${data.userId} came online`);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(data.userId);
          return newSet;
        });
      }
    };

    const handleUserOffline = (data) => {
      if (data?.userId) {
        console.log(`User ${data.userId} went offline`);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    return () => {
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  };


  // Reload chats when navigating
  useEffect(() => {
    if (location.pathname.startsWith('/chat')) {
      loadChats();
    }
  }, [location.pathname]);

  // Load selected chat when chatId changes
  useEffect(() => {
    if (chatId) {
      loadSelectedChat();
      // Don't clear messages immediately - keep them visible during transition for smoother UX
      loadMessages();
      setupSocket();
      // Clear reply and media when switching chats
      setReplyingTo(null);
      setSelectedMedia(null);
      // Clear new message indicator for this chat
      setNewMessageIndicators((prev) => {
        const newSet = new Set(prev);
        newSet.delete(parseInt(chatId));
        return newSet;
      });
    } else {
      setSelectedChat(null);
      setMessages([]);
      setReplyingTo(null);
      setSelectedMedia(null);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for new messages to update unread counts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.log('Socket not available for receive_message listener');
      return;
    }

    console.log('Setting up receive_message listener for chatId:', chatId);

    const handleReceiveMessage = (message) => {
      // Debug: Log all received messages
      console.log('Received message:', { 
        id: message.id, 
        chatId: message.chatId, 
        hasMedia: !!message.media,
        media: message.media,
        content: message.content?.substring(0, 50)
      });
      
      // Debug: Log messages with media or replies
      if (message.media) {
        console.log('Received message with media:', message);
      }
      if (message.reply_to) {
        console.log('Received message with reply:', message);
      }
      // If message is for currently selected chat, add it to messages
      if (message.chatId === parseInt(chatId)) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });

        // Mark as read if not from current user (since chat window is open)
        if (message.sender.id !== user?.id) {
          messageAPI.markAsRead(chatId).catch(err => console.error('Failed to mark as read:', err));
          // Update unread count in chat list
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === message.chatId ? { ...chat, unread_count: 0 } : chat
            )
          );
        }
      } else {
        // Message is for a different chat, increment unread count and show indicator
        if (message.sender.id !== user?.id) {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === message.chatId
                ? { ...chat, unread_count: (chat.unread_count || 0) + 1 }
                : chat
            )
          );
          // Add blue indicator for this chat
          setNewMessageIndicators((prev) => {
            const newSet = new Set(prev);
            newSet.add(message.chatId);
            return newSet;
          });
        }
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [chatId, user]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getAll();
      const chats = response.data.chats || [];
      setChats(chats);
      
      // Load online statuses for users in chats
      await loadOnlineStatusesForChats(chats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineStatusesForChats = async (chatsList) => {
    if (!chatsList || chatsList.length === 0 || !user) {
      console.log('Skipping online status load - no chats or user');
      return;
    }

    try {
      // Collect all user IDs from chats
      const userIds = new Set();
      chatsList.forEach(chat => {
        if (chat.other_participant) {
          userIds.add(chat.other_participant.id);
        }
        if (chat.members) {
          chat.members.forEach(member => {
            if (member.id !== user.id) {
              userIds.add(member.id);
            }
          });
        }
      });

      if (userIds.size > 0) {
        const statusResponse = await userAPI.getOnlineStatuses(Array.from(userIds));
        const onlineSet = new Set();
        statusResponse.data.statuses.forEach(status => {
          if (status.isOnline) {
            onlineSet.add(status.userId);
          }
        });
        setOnlineUsers(onlineSet);
      }
    } catch (error) {
      console.error('Failed to load online statuses:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const loadSelectedChat = async () => {
    try {
      const response = await chatAPI.getAll();
      const foundChat = response.data.chats.find((c) => c.id === parseInt(chatId));
      if (foundChat) {
        setSelectedChat(foundChat);
      } else {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
      navigate('/chat');
    }
  };

  const loadMessages = async () => {
    try {
      setMessagesLoading(true);
      const response = await messageAPI.getMessages(chatId);
      const messages = response.data.messages || [];
      // Debug: Log messages with media or replies
      const messagesWithMedia = messages.filter(m => m.media);
      if (messagesWithMedia.length > 0) {
        console.log('Loaded messages with media:', messagesWithMedia);
      }
      const messagesWithReplies = messages.filter(m => m.reply_to);
      if (messagesWithReplies.length > 0) {
        console.log('Messages with replies:', messagesWithReplies);
      }
      // Update messages - this will smoothly replace old messages with new ones
      setMessages(messages);
      // Messages are automatically marked as read when fetched
      // Update unread count in chat list
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === parseInt(chatId) ? { ...chat, unread_count: 0 } : chat
        )
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
      // On error, clear messages to show error state
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    if (!socket || !chatId) return;

    // Remove any existing listeners first (but NOT receive_message - it's handled separately)
    socket.off('joined_chat');
    socket.off('user_typing');
    socket.off('user_stopped_typing');

    // Join chat room
    socket.emit('join_chat', { chatId: parseInt(chatId) });

    // Handler for typing indicators
    const handleUserTyping = (data) => {
      if (data.chatId === parseInt(chatId)) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.id === data.user.id)) {
            return [...prev, data.user];
          }
          return prev;
        });

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

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size based on type
    if (file.type.startsWith('video/')) {
      // Videos can be up to 50MB
      if (file.size > 50 * 1024 * 1024) {
        alert('Video size must be less than 50MB');
        return;
      }
    } else if (file.size > 10 * 1024 * 1024) {
      // Other files max 10MB
      alert('File size must be less than 10MB');
      return;
    }

    // Determine media type
    let mediaType = 'file';
    if (file.type.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
    }

    // Create preview for images
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedMedia({
        file,
        preview: reader.result,
        type: mediaType,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendVoiceNote = async () => {
    if (!audioBlob || !chatId) return;

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
    if ((!newMessage.trim() && !selectedMedia && !audioBlob) || sending || !chatId) return;

    const content = newMessage.trim() || '';
    const replyToMessageId = replyingTo?.id || null;
    let mediaUrl = null;
    let mediaType = selectedMedia?.type || null;
    
    // Upload image if it's an image file (not base64)
    if (selectedMedia && selectedMedia.type === 'image' && selectedMedia.file) {
      try {
        setSending(true);
        const response = await uploadAPI.uploadImage(selectedMedia.file);
        const serverBaseURL = getServerBaseURL();
        mediaUrl = response.data.url.startsWith('http') 
          ? response.data.url 
          : `${serverBaseURL}${response.data.url}`;
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert(error.response?.data?.error || 'Failed to upload image');
        setSending(false);
        return;
      }
    } else if (selectedMedia && selectedMedia.type === 'video' && selectedMedia.file) {
      // Upload video to server
      try {
        setSending(true);
        const response = await uploadAPI.uploadVideo(selectedMedia.file);
        const serverBaseURL = getServerBaseURL();
        mediaUrl = response.data.url.startsWith('http') 
          ? response.data.url 
          : `${serverBaseURL}${response.data.url}`;
      } catch (error) {
        console.error('Failed to upload video:', error);
        alert(error.response?.data?.error || 'Failed to upload video');
        setSending(false);
        return;
      }
    } else if (selectedMedia) {
      // For other files, use base64 preview (or implement separate upload endpoints)
      mediaUrl = selectedMedia.preview;
    }
    
    // Debug: Log what we're sending
    console.log('Sending message:', { content, mediaUrl: mediaUrl ? 'present' : 'null', mediaType });
    
    setNewMessage('');
    setReplyingTo(null);
    setSelectedMedia(null);

    const socket = getSocket();
    if (socket && socket.connected) {
      const messageData = {
        chatId: parseInt(chatId),
        content: content,
        reply_to_message_id: replyToMessageId,
        media_url: mediaUrl,
        media_type: mediaType,
      };
      console.log('Emitting send_message:', messageData);
      socket.emit('send_message', messageData);
    } else {
      try {
        await messageAPI.sendMessage(chatId, content, replyToMessageId, mediaUrl, mediaType);
        loadMessages();
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }

    setSending(false);
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !socket.connected || !chatId) return;

    socket.emit('typing_start', { chatId: parseInt(chatId) });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { chatId: parseInt(chatId) });
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Parse mentions (@username) and highlight them
  const parseMentions = (text, members = [], isOwnMessage = false) => {
    if (!text) return text;
    
    // Create a map of usernames for quick lookup
    const usernameMap = new Map();
    members.forEach(member => {
      usernameMap.set(member.username.toLowerCase(), member.username);
    });
    
    // Split text by @mentions
    const parts = text.split(/(@\w+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.substring(1).toLowerCase();
        if (usernameMap.has(username)) {
          return (
            <span 
              key={index} 
              className={`font-semibold ${isOwnMessage ? 'text-blue-200' : 'text-blue-600'}`}
            >
              {part}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getChatName = (chat) => {
    if (!chat) return 'Unknown';
    if (chat.is_group) {
      return chat.name || 'Group Chat';
    }
    return chat.other_participant?.username || 'Unknown User';
  };

  const handleChatClick = (chat) => {
    navigate(`/chat/${chat.id}`);
  };

  const handleMenuToggle = (e, chatId) => {
    e.stopPropagation(); // Prevent chat click
    setOpenMenuId(openMenuId === chatId ? null : chatId);
  };

  const handleDeleteChat = async (chat) => {
    setOpenMenuId(null); // Close menu
    
    const chatName = getChatName(chat);
    const confirmMessage = chat.is_group 
      ? `Delete "${chatName}" group chat? You will be removed from the group.`
      : `Delete chat with ${chatName}?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await chatAPI.delete(chat.id);
      
      // Remove from local state
      setChats(chats.filter(c => c.id !== chat.id));
      
      // If this was the selected chat, navigate away
      if (selectedChat && selectedChat.id === chat.id) {
        navigate('/chat');
        setSelectedChat(null);
        setMessages([]);
      }
      
      // Clear any indicators for this chat
      setNewMessageIndicators(prev => {
        const newSet = new Set(prev);
        newSet.delete(chat.id);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert(error.response?.data?.error || 'Failed to delete chat');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Left Sidebar - Chat List */}
      <div className={`${chatId ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col lg:min-w-[300px] relative z-10`}>
        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-whisper font-bold">whisper</h1>
            <span className="text-sm opacity-75">Chats</span>
          </div>
          <div className="flex items-center space-x-2">
            <DarkModeToggle />
            <MicroExpander
              text="Create Group"
              variant="outline"
              icon={<Users className="w-4 h-4" />}
              onClick={() => setShowCreateGroupModal(true)}
              className="text-white border-white/30 hover:bg-white/10"
            />
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-1 px-2 py-1 text-sm bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-500 rounded"
              title="My Profile"
            >
              <Avatar user={user} size={20} />
              <span className="text-sm">{user?.username}</span>
            </button>
            <button
              onClick={logout}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User Search */}
        <div className="p-2 md:p-3 border-b border-gray-200 dark:border-gray-700">
          <UserSearch />
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              <p>No chats yet. Search for users to start chatting!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {chats.map((chat) => {
                const hasNewMessageIndicator = newMessageIndicators.has(chat.id);
                return (
                  <div
                    key={chat.id}
                    className={`group relative flex items-center ${hasNewMessageIndicator ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                  >
                    {/* Blue indicator dot */}
                    {hasNewMessageIndicator && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 dark:bg-blue-400"></div>
                    )}
                    <button
                      onClick={() => handleChatClick(chat)}
                      className={`flex-1 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        chat.id === parseInt(chatId) ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center flex-1 min-w-0">
                          {/* Avatar */}
                          {!chat.is_group && chat.other_participant ? (
                            <div className="relative mr-3 flex-shrink-0">
                              <Avatar user={chat.other_participant} size={48} />
                              {/* Online status indicator */}
                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                onlineUsers.has(chat.other_participant.id) ? 'bg-green-500' : 'bg-gray-400'
                              }`} title={onlineUsers.has(chat.other_participant.id) ? 'Online' : 'Offline'}></div>
                            </div>
                          ) : chat.is_group ? (
                            <div className="mr-3 flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                                {chat.name ? chat.name.substring(0, 2).toUpperCase() : 'GC'}
                              </div>
                            </div>
                          ) : null}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <h3 className={`text-sm font-medium truncate ${
                                hasNewMessageIndicator ? 'text-blue-900 dark:text-blue-200 font-semibold' : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {getChatName(chat)}
                              </h3>
                              {chat.is_group && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                  Group
                                </span>
                              )}
                              {chat.unread_count > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500 dark:bg-blue-600 text-white rounded-full font-semibold">
                                  {chat.unread_count}
                                </span>
                              )}
                            </div>
                            {chat.last_message && (
                              <p className={`mt-1 text-xs truncate ${
                                hasNewMessageIndicator ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {chat.last_message.content}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {chat.last_message && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {formatTimestamp(chat.last_message.timestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    {/* Menu button - appears on hover, outside the main button */}
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity px-2" data-menu-container style={{ zIndex: 1000 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuToggle(e, chat.id);
                        }}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors relative"
                        title="More options"
                        style={{ zIndex: 1001 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                      
                      {/* Dropdown menu */}
                      {openMenuId === chat.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1" style={{ zIndex: 1002 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Window or Empty State */}
      <div className={`${chatId ? 'flex' : 'hidden lg:flex'} flex-1 flex-col relative`}>
        {chatId && selectedChat ? (
          <>
            {/* Group Info Sidebar */}
            {showGroupInfo && selectedChat.is_group && (
              <>
                {/* Overlay */}
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-40"
                  onClick={() => setShowGroupInfo(false)}
                />
                {/* Sidebar */}
                <div className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col">
                  <GroupManagement
                    chat={selectedChat}
                    onClose={() => setShowGroupInfo(false)}
                    onUpdate={() => {
                      loadChats();
                      loadChat(chatId);
                    }}
                  />
                </div>
              </>
            )}

            {/* Chat Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 md:px-6 py-3 md:py-4 flex items-center justify-between">
              {/* Back button for mobile */}
              <button
                onClick={() => navigate('/chat')}
                className="lg:hidden mr-2 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to chats"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center flex-1 min-w-0">
                {/* Avatar */}
                {!selectedChat.is_group && selectedChat.other_participant ? (
                  <div className="relative mr-3">
                    <Avatar user={selectedChat.other_participant} size={40} />
                    {/* Online status indicator */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                      onlineUsers.has(selectedChat.other_participant.id) ? 'bg-green-500' : 'bg-gray-400'
                    }`} title={onlineUsers.has(selectedChat.other_participant.id) ? 'Online' : 'Offline'}></div>
                  </div>
                ) : selectedChat.is_group ? (
                  <div className="mr-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {selectedChat.name ? selectedChat.name.substring(0, 2).toUpperCase() : 'GC'}
                    </div>
                  </div>
                ) : null}
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-semibold dark:text-white truncate">{getChatName(selectedChat)}</h2>
                  {selectedChat.is_group ? (
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{selectedChat.members.length} members</p>
                  ) : selectedChat.other_participant && (
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {onlineUsers.has(selectedChat.other_participant.id) ? 'Online' : 'Offline'}
                    </p>
                  )}
                </div>
              </div>
              {selectedChat.is_group && (
                <MicroExpander
                  text="Group Info"
                  variant="ghost"
                  icon={<Info className="w-4 h-4" />}
                  onClick={() => setShowGroupInfo(!showGroupInfo)}
                  className="text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900 ml-2"
                />
              )}
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 bg-gray-50 dark:bg-gray-900">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    // Debug: Log messages with media or reply_to
                    if (message.media) {
                      console.log('Rendering message with media:', message.id, message.media);
                    }
                    if (message.reply_to) {
                      console.log('Rendering message with reply:', message.id, message.reply_to);
                    }
                    return (
                    <div
                      key={message.id}
                      className={`flex items-end group mb-2 md:mb-0 ${
                        message.sender.id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.sender.id !== user?.id && (
                        <div className="mr-2 mb-1">
                          <Avatar user={message.sender} size={32} />
                        </div>
                      )}
                      <div className="flex flex-col items-end">
                        <div
                          className={`max-w-[85%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 text-sm md:text-base rounded-lg relative ${
                            message.sender.id === user?.id
                              ? 'bg-blue-500 dark:bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {/* Reply preview */}
                          {message.reply_to && (
                            <div className={`mb-2 pb-2 border-l-4 pl-2 ${
                              message.sender.id === user?.id
                                ? 'border-blue-300 dark:border-blue-400'
                                : 'border-blue-500 dark:border-blue-400'
                            }`}>
                              <div className={`text-xs font-medium ${
                                message.sender.id === user?.id
                                  ? 'text-blue-100'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                {message.reply_to.sender?.username || 'Unknown'}
                              </div>
                              <div className={`text-xs truncate ${
                                message.sender.id === user?.id
                                  ? 'text-blue-200'
                                  : 'text-gray-600 dark:text-gray-300'
                              }`}>
                                {message.reply_to.content || 'Message deleted'}
                              </div>
                            </div>
                          )}
                          
                          {message.sender.id !== user?.id && (
                            <div className="text-xs font-medium mb-1 opacity-75 dark:text-gray-300">
                              {message.sender.username}
                            </div>
                          )}
                          {/* Media display */}
                          {message.media && (
                            <div className="mb-2">
                              {message.media.type === 'image' && (
                                <img 
                                  src={message.media.url} 
                                  alt="Shared image" 
                                  className="max-w-full max-h-64 rounded-lg cursor-pointer"
                                  onClick={() => window.open(message.media.url, '_blank')}
                                />
                              )}
                              {message.media.type === 'audio' && (
                                <audio 
                                  src={message.media.url.startsWith('http') 
                                    ? message.media.url 
                                    : `${getServerBaseURL()}${message.media.url}`} 
                                  controls 
                                  className="max-w-full"
                                >
                                  Your browser does not support the audio element.
                                </audio>
                              )}
                              {message.media.type === 'video' && (
                                <video 
                                  src={message.media.url} 
                                  controls 
                                  className="max-w-full max-h-64 rounded-lg"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              )}
                              {message.media.type === 'file' && (
                                <a
                                  href={message.media.url}
                                  download={message.media.name || 'file'}
                                  className={`inline-flex items-center px-3 py-2 rounded-lg ${
                                    message.sender.id === user?.id
                                      ? 'bg-blue-400 dark:bg-blue-500 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                  }`}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                  </svg>
                                  {message.media.name || 'Download file'}
                                </a>
                              )}
                            </div>
                          )}
                          {message.content && (
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {parseMentions(message.content, selectedChat?.members || [], message.sender.id === user?.id)}
                            </div>
                          )}
                          <div
                            className={`text-xs mt-1 ${
                              message.sender.id === user?.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {formatMessageTimestamp(message.timestamp)}
                          </div>
                        </div>
                        {/* Reply button - appears on hover */}
                        <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MicroExpander
                            text="Reply"
                            variant="ghost"
                            icon={<MessageCircle className="w-5 h-5" />}
                            onClick={() => setReplyingTo(message)}
                            className="hover:text-blue-600 dark:hover:text-blue-400"
                          />
                        </div>
                      </div>
                    </div>
                    );
                  })}
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
              {/* Reply Preview */}
              {replyingTo && (
                <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-400 rounded flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                      Replying to {replyingTo.sender.username}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {replyingTo.content}
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    title="Cancel reply"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
              {/* Media Preview */}
              {selectedMedia && (
                <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {selectedMedia.type === 'image' && (
                      <img 
                        src={selectedMedia.preview} 
                        alt="Preview" 
                        className="max-w-xs max-h-32 rounded-lg"
                      />
                    )}
                    {selectedMedia.type === 'video' && (
                      <video 
                        src={selectedMedia.preview} 
                        controls 
                        className="max-w-xs max-h-32 rounded-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                    {selectedMedia.type === 'file' && (
                      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {selectedMedia.name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    title="Remove media"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
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
                  <MicroExpander
                    text={uploadingAudio ? 'Sending' : 'Send'}
                    variant="default"
                    icon={<Send className="w-4 h-4" />}
                    onClick={handleSendVoiceNote}
                    disabled={uploadingAudio}
                    isLoading={uploadingAudio}
                    className="text-sm"
                  />
                  <MicroExpander
                    text="Cancel"
                    variant="outline"
                    icon={<X className="w-4 h-4" />}
                    onClick={cancelRecording}
                    disabled={uploadingAudio}
                    className="text-sm"
                  />
                </div>
              ) : null}
              <form onSubmit={sendMessage} className="flex space-x-1 md:space-x-2">
                <input
                  type="file"
                  id="media-input"
                  accept="image/*,video/*,*/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isRecording}
                  tabIndex={-1}
                />
                <MicroExpander
                  type="button"
                  text="Attach"
                  variant="ghost"
                  icon={<Paperclip className="w-4 h-4 md:w-5 md:h-5" />}
                  disabled={isRecording}
                  className={isRecording ? 'opacity-50' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isRecording) {
                      document.getElementById('media-input')?.click();
                    }
                  }}
                />
                <div className="relative">
                  <MicroExpander
                    type="button"
                    text="Emoji"
                    variant="ghost"
                    icon={<Smile className="w-4 h-4 md:w-5 md:h-5" />}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    disabled={isRecording || uploadingAudio}
                    className={showEmojiPicker ? 'bg-gray-200 dark:bg-gray-700' : ''}
                    data-emoji-button
                  />
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 z-50 max-w-[90vw] md:max-w-none" data-emoji-picker>
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setNewMessage(prev => prev + emojiData.emoji);
                          setShowEmojiPicker(false);
                        }}
                        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                        width={Math.min(350, window.innerWidth - 40)}
                        height={400}
                      />
                    </div>
                  )}
                </div>
                <MicroExpander
                  type="button"
                  text="Record"
                  variant={isRecording ? 'destructive' : 'default'}
                  icon={<Mic className="w-4 h-4 md:w-5 md:h-5" />}
                  onClick={startRecording}
                  disabled={isRecording || uploadingAudio}
                  isLoading={isRecording}
                  className={isRecording ? '' : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 border-green-600 dark:border-green-700'}
                />
                <div className="flex-1 relative">
                  <input
                    id="message-input"
                    name="message"
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    onFocus={() => setShowEmojiPicker(false)}
                    placeholder={replyingTo ? `Reply to ${replyingTo.sender.username}...` : "Type a message..."}
                    className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    disabled={sending || isRecording || uploadingAudio}
                    autoComplete="off"
                  />
                </div>
                <MicroExpander
                  type="submit"
                  text={sending || uploadingAudio ? 'Sending' : 'Send'}
                  variant="default"
                  icon={<Send className="w-4 h-4 md:w-5 md:h-5" />}
                  isLoading={sending || uploadingAudio}
                  disabled={(!newMessage.trim() && !selectedMedia && !audioBlob) || sending || uploadingAudio || isRecording}
                  className="disabled:opacity-50"
                />
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No chat selected</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select a chat from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => {
          setShowCreateGroupModal(false);
          loadChats(); // Reload chats after closing modal
        }}
      />
    </div>
  );
}

