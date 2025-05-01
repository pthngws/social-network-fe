import api from './api';

export const friendshipService = {
  // Get all friend requests
  getFriendshipRequests: async () => {
    try {
      const response = await api.get('/friendship/requests');
      console.log('Friendship requests response:', response.data); // Debug
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching friend requests:', error.response || error);
      return [];
    }
  },

  // Get all friends
  getAllFriendships: async () => {
    try {
      const response = await api.get('/friendship/all');
      console.log('Friendships response:', response.data); // Debug
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching friends:', error.response || error);
      return [];
    }
  },

  // Send a friend request
  addFriendship: async (request) => {
    try {
      const response = await api.post('/friendship/add', request);
      console.log('Add friendship response:', response.data); // Debug
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error.response || error);
      throw error;
    }
  },

  // Accept a friend request
  acceptFriendship: async (friendshipDto) => {
    try {
      const response = await api.post('/friendship/accept', friendshipDto);
      console.log('Accept friendship response:', response.data); // Debug
      return response.data;
    } catch (error) {
      console.error('Error accepting friend request:', error.response || error);
      throw error;
    }
  },

  // Cancel a friend request
  cancelFriendship: async (friendshipDto) => {
    try {
      const response = await api.post('/friendship/cancel', friendshipDto);
      console.log('Cancel friendship response:', response.data); // Debug
      return response.data;
    } catch (error) {
      console.error('Error canceling friend request:', error.response || error);
      throw error;
    }
  },
};