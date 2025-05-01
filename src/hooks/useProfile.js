// src/hooks/useProfile.js
import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';

const useProfile = (userId = null) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await (userId
        ? userService.getUserById(userId)
        : userService.getProfile());
      if (response.data.status === 200) {
        setUser(response.data.data);
      } else {
        setError('Không thể lấy thông tin người dùng');
      }
    } catch (err) {
      setError(err.message || 'Lỗi lấy thông tin người dùng');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refetch = () => fetchProfile();

  return { user, loading, error, refetch };
};

export default useProfile;