import React, { useState, useEffect, useRef } from 'react';
import useProfile from '../hooks/useProfile';
import usePosts from '../hooks/usePosts';
import CreatePostModal from '../components/CreatePostModal';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Post from '../components/Post';
import StoryList from '../components/StoryList';

const Home = () => {
  const { user } = useProfile();
  const { posts, fetchPosts, hasMore, loading } = usePosts();
  const [showModal, setShowModal] = useState(false);
  const observerRef = useRef(); // 🔥 Ref cho IntersectionObserver
  const lastPostRef = useRef(); // 🔥 Ref cho phần tử cuối cùng

  // 🔥 Infinite Scroll logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(); // Gọi fetchPosts khi cuộn đến cuối
        }
      },
      { threshold: 1.0 }
    );

    if (lastPostRef.current) {
      observer.observe(lastPostRef.current);
    }

    return () => {
      if (lastPostRef.current) {
        observer.unobserve(lastPostRef.current);
      }
    };
  }, [hasMore, loading, fetchPosts]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-2 sm:px-4 py-4 sm:py-8 mt-10">
      <div className="max-w-2xl mx-auto">
        {/* Stories Section */}
        <StoryList />

        {/* Create Post Card */}
        <Card className="mb-4">
          <div className="flex items-center gap-4 p-4">
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover"
            />
            <Input
              placeholder="Bạn đang nghĩ gì?"
              className="flex-1"
              onClick={() => setShowModal(true)}
              readOnly
            />
          </div>
        </Card>

        {/* Posts List */}
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostRef : null} // 🔥 Gắn ref vào bài viết cuối
            >
              <Post post={post} />
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Chưa có bài viết nào
          </p>
        )}

        {loading && <p className="text-center">Đang tải...</p>}

        <CreatePostModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onPostCreated={() => fetchPosts()}
        />
      </div>
    </div>
  );
};

export default Home;