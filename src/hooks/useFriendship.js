// src/hooks/useFriendship.js
import { useState, useCallback } from 'react';
import { friendshipService } from '../services/friendshipService';

const useFriendship = () => {
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await friendshipService.getAllFriendships();
      if (response.data.status === 200) {
        setFriends(response.data.data || []);
      } else {
        setError('Không thể lấy danh sách bạn bè');
      }
    } catch (err) {
      setError(err.message || 'Lỗi lấy danh sách bạn bè');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFriendAction = useCallback(async (action, receiverId, refetchProfile) => {
    try {
      const actions = {
        send: () => friendshipService.addFriendship({ receiverId }),
        accept: () => friendshipService.acceptFriendship({ receiverId }),
        cancel: () => friendshipService.cancelFriendship({ receiverId }),
      };
      await actions[action]();
      refetchProfile();
    } catch (err) {
      setError(err.message || 'Lỗi xử lý yêu cầu bạn bè');
    }
  }, []);

  const removeFriend = useCallback(async (friendId) => {
    if (confirm('Bạn có chắc chắn muốn xóa bạn này?')) {
      try {
        await friendshipService.cancelFriendship({ receiverId: friendId });
        setFriends(prevFriends => prevFriends.filter(f => f.user.id !== friendId));
      } catch (err) {
        setError(err.message || 'Lỗi xóa bạn');
      }
    }
  }, []);

  return { friends, fetchFriends, handleFriendAction, removeFriend, error, loading };
};

export default useFriendship;