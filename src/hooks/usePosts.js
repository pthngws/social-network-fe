// src/hooks/usePosts.js
import { useState, useEffect, useCallback } from 'react';
import { postService } from '../services/postService';

const usePosts = (type = 'all', userId = null) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (type === 'my') {
        response = await postService.getMyPosts();
      } else if (type === 'user' && userId) {
        response = await postService.getUserPosts(userId);
      } else {
        response = await postService.getAllPosts();
      }
      if (response.data.status === 200) {
        setPosts(response.data.data);
      } else {
        setError('Không thể lấy bài viết');
      }
    } catch (err) {
      setError(err.message || 'Lỗi lấy bài viết');
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, fetchPosts };
};

export default usePosts;