import api from './api';

export const notifyService = {
  // Get all notifications
  getNotifications: () => api.get('/notify'),
};