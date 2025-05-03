import api from './api';

export const storyService = {
  // Get all stories
  getAllStories: () => api.get('/stories'),

  // Create a new story with media and music
  createStory: (formData) => {
    return api.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get all available background musics
  getAllMusics: () => api.get('/musics'),

  // Get music by ID
  getMusicById: (id) => api.get(`/musics/${id}`),

  // View a specific story
  viewStory: (id) => api.get(`/stories/${id}`),

  // Delete a story
  deleteStory: (id) => api.delete(`/stories/${id}`),

  // Get interactions (views and reactions) for a story
  getStoryInteractions: (storyId) => api.get(`/stories/${storyId}/interactions`),

  // React to a story
  reactStory: (storyId, reactionType) => {
    return api.post(`/stories/${storyId}/reactions?reactionType=${reactionType}`);
  },
}; 