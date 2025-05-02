import api from './api';

export const onlineStatusService = {
  // Kiểm tra trạng thái online của người dùng
  isUserOnline: (userId) => api.get(`/api/online-status/${userId}`),

  // Cập nhật thời gian last seen
  ping: (userId) => api.post(`/api/online-status/ping/${userId}`),

  // Lấy thời gian last seen
  getLastSeen: (userId) => api.get(`/api/online-status/last-seen/${userId}`),

  // Lấy số phút kể từ last seen
  getLastSeenMinutesAgo: (userId) => api.get(`/api/online-status/minutes-ago/${userId}`)
};