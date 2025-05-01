import api from './api';

export const friendshipService = {
  // Get all friend requests
  getFriendshipRequests: () => api.get('/friendship/requests'),

  // Get all friends
  getAllFriendships: () => api.get('/friendship/all'),

  // Send a friend request
  addFriendship: (request) => api.post('/friendship/add', request),

  // Accept a friend request
  acceptFriendship: (friendshipDto) => api.post('/friendship/accept', friendshipDto),

  // Cancel a friend request
  cancelFriendship: (friendshipDto) => api.post('/friendship/cancel', friendshipDto),
};