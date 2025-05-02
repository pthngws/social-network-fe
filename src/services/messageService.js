import api from './api';

export const messageService = {
  // Get friend list for a user
  getFriendList: (id) => api.get(`/getFriendList/${id}`),

  // Get messages between two users
  getMessages: (senderId, receiverId) =>
    api.get('/getMessages', { params: { senderId, receiverId } }),
  markMessagesAsRead: (senderId) => api.put(`/markMessagesAsRead/${senderId}`),
  // Note: WebSocket-based sendMessage is handled separately (e.g., via a WebSocket client)
};