import api from './api';

export const taskService = {
  // Lấy tất cả task của user hiện tại
  getTasks: () => api.get('/tasks'),

  // Lấy task theo ID
  getTask: (taskId) => api.get(`/tasks/${taskId}`),

  // Tạo mới task
  addTask: (taskRequest) => api.post('/tasks', taskRequest),

  // Cập nhật task theo ID
  updateTask: (id, taskRequest) => api.put(`/tasks/${id}`, taskRequest),

  // Đánh dấu task là hoàn thành
  completeTask: (id) => api.patch(`/tasks/${id}/complete`),

  // Xóa task
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};
