import api from './api';

export const userService = {
  // Search users by name
  searchUsers: (name) => api.get('/user/search', { params: { name } }),

  // Get user by ID
  getUserById: (id) => api.get(`/user/${id}`),

  // Get current user's profile
  getProfile: () => api.get('/user/profile'),

// Update user profile
updateProfile: (updateProfileRequest, avatarFile) => {
  const formData = new FormData();
  formData.append('firstName', updateProfileRequest.firstName);
  formData.append('lastName', updateProfileRequest.lastName);
  formData.append('about', updateProfileRequest.about);
  formData.append('birthday', updateProfileRequest.birthday);
  formData.append('gender', updateProfileRequest.gender);
  if (avatarFile) {
    formData.append('avatarFile', avatarFile);
  }
  return api.put('/user/profile/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
},

};