import api from './api';

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const verifyEmail = (email, otp) => api.post('/auth/verify-email', { email, otp });
export const resendOtp = (email) => api.post('/auth/resend-otp', { email });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const verifyResetOtp = (email, otp) => api.post('/auth/verify-reset-otp', { email, otp });
export const resetPassword = (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword });
export const refreshToken = () => api.post('/auth/refresh-token');
export const revokeToken = () => api.post('/auth/revoke-token');
export const verifyToken = () => api.get('/auth/verify');
export const oauth2Login = () => api.get('/auth/oauth2-login', { withCredentials: true });
export const verifyOtp = (email, otp) => api.post('/auth/verify-otp', null, { params: { email, otp } });
  