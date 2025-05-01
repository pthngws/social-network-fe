import api from './api';

export const notifyService = {
  getNotifications: async () => {
    try {
      const response = await api.get('/notify');
      console.log('API /notify response:', response.data); // Debug response
      const notifications = response.data.data;
      return Array.isArray(notifications) ? notifications : [];
    } catch (error) {
      console.error('Error in getNotifications:', error.response || error);
      throw error; // Ném lỗi để frontend xử lý
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.get('/notify/read-all');
      return response.data;
    } catch (error) {
      console.error('Error in markAllAsRead:', error.response || error);
      throw error;
    }
  },
};