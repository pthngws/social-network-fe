import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://wsproject-5eb9.onrender.com/";

// Create a separate axios instance for refresh token to avoid interceptor loops
const axiosRefresh = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// Gắn access token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Biến để ngăn chặn gọi refreshToken nhiều lần đồng thời
let isRefreshing = false;
let failedQueue = [];
let refreshAttempts = 0; // Track refresh attempts to prevent infinite loops
const MAX_REFRESH_ATTEMPTS = 2;

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if URL is the refresh token endpoint to avoid infinite loops
    if (originalRequest?.url?.includes('refresh-token')) {
      return Promise.reject(error);
    }

    // Don't retry certain types of requests
    if (!originalRequest || originalRequest._retry || refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      return Promise.reject(error);
    }

    // Nếu bị 401 và chưa thử refresh
    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      refreshAttempts++;

      try {
        // Use axiosRefresh to avoid interceptor recursion
        const res = await axiosRefresh.post(
          "auth/refresh-token",
          {},
          { withCredentials: true }
        );

        if (res.data && res.data.data) {
          const newToken = res.data.data;
          localStorage.setItem("token", newToken);
          api.defaults.headers.Authorization = `Bearer ${newToken}`;
          
          // Set the Authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          processQueue(null, newToken);
          return api(originalRequest);
        } else {
          processQueue(new Error('Failed to refresh token'), null);
          return Promise.reject(error);
        }
      } catch (err) {
        processQueue(err, null);
        
        // Clear token only if refresh truly failed
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        }
        
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // For errors that are not 401 or after refresh failed
    return Promise.reject(error);
  }
);

// Reset refresh attempts counter periodically
setInterval(() => {
  refreshAttempts = 0;
}, 60000); // Reset every minute

export default api;
