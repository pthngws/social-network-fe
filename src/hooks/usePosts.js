import { useState, useEffect, useCallback, useRef } from 'react';
import { postService } from '../services/postService';

const usePosts = (type = 'all', userId = null, pageSize = 10) => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0); // Trang hiện tại (BE default = 0)
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isInitialMount = useRef(true); // Ngăn gọi 2 lần trong React Strict Mode

  const fetchPosts = useCallback(
    async (reset = false) => {
      // Ngăn gọi trùng khi đang loading hoặc không còn dữ liệu
      if (loading || (!reset && !hasMore)) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let response;
        let newPosts = [];
        let isLastPage = false;

        // Xử lý theo loại bài viết
        if (type === 'all') {
          // Lấy tất cả bài viết với phân trang
          response = await postService.getAllPosts(reset ? 0 : page, pageSize);
          if (response.data.status === 200) {
            const data = response.data.data; // Page<PostDto>
            newPosts = data.content;
            isLastPage = data.last;
          } else {
            throw new Error('Không thể lấy danh sách bài viết');
          }
        } else if (type === 'my') {
          // Lấy bài viết của người dùng hiện tại
          response = await postService.getMyPosts();
          if (response.data.status === 200) {
            newPosts = response.data.data; // TODO: Cần BE hỗ trợ phân trang
            isLastPage = true; // Giả định không có phân trang
          } else {
            throw new Error('Không thể lấy bài viết của bạn');
          }
        } else if (type === 'user' && userId) {
          // Lấy bài viết của một user cụ thể
          response = await postService.getUserPosts(userId);
          if (response.data.status === 200) {
            newPosts = response.data.data; // TODO: Cần BE hỗ trợ phân trang
            isLastPage = true; // Giả định không có phân trang
          } else {
            throw new Error('Không thể lấy bài viết của người dùng');
          }
        } else {
          // Trường hợp type không hợp lệ hoặc thiếu userId
          throw new Error('Loại bài viết không hợp lệ hoặc thiếu userId');
        }

        // Loại bỏ bài viết trùng lặp dựa trên ID
        const filteredPosts = newPosts.filter(
          newPost => !posts.some(prevPost => prevPost.id === newPost.id)
        );

        // Cập nhật state
        setPosts(prev => (reset ? filteredPosts : [...prev, ...filteredPosts]));
        setHasMore(!isLastPage);
        setPage(prev => (reset ? 1 : prev + 1));
      } catch (err) {
        console.error('Lỗi khi fetch bài viết:', err);
        setError(err.message || 'Lỗi lấy bài viết');
      } finally {
        setLoading(false);
      }
    },
    [type, userId, page, pageSize, loading, hasMore, posts]
  );

  // Load dữ liệu lần đầu khi mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchPosts(true); // Reset danh sách khi load lần đầu
    }
  }, [fetchPosts]);

  return { posts, loading, error, fetchPosts, hasMore };
};

export default usePosts;