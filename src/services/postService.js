import api from './api';

export const postService = {
  // Get posts by user ID
  getUserPosts: (id) => api.get(`/userpost/${id}`),

  // Get current user's posts
  getMyPosts: () => api.get('/myposts'),

  // Get all posts
  getAllPosts: () => api.get('/posts'),

  // Create a new post
  createPost: (content, mediaFiles) => {
    const formData = new FormData();
    formData.append('content', content);
    if (mediaFiles) {
      mediaFiles.forEach((file) => formData.append('media', file));
    }
    return api.post('/post', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Update a post
  updatePost: (id, content, mediaFiles, mediaToDelete) => {
    const formData = new FormData();
    formData.append('content', content);
    if (mediaFiles && mediaFiles.length > 0) {
      mediaFiles.forEach((file) => formData.append('media', file));
    }
    if (mediaToDelete && mediaToDelete.length > 0) {
      formData.append('mediaToDelete', JSON.stringify(mediaToDelete));
    }
    return api.put(`/post/${id}`, formData);
  },

  // Delete a post
  deletePost: (id) => api.delete(`/post/${id}`),

  // React to a post
  reactPost: (id, reactionType) => api.post(`/react/${id}?reactionType=${reactionType}`),

  // Comment on a post
  commentPost: (postId, commentDto) => api.post(`/comment/${postId}`, commentDto),

  // Reply to a comment
  replyComment: (postId, commentDto) => api.post(`/comment/${postId}`, commentDto),

  // Get comments for a post
  getComments: (id) => api.get(`/comment/${id}`),

  // Delete a comment
  deleteComment: (id) => api.delete(`/comment/${id}`),

  // Report a post
  reportPost: (reportRequest) => api.post('/report', reportRequest),
};