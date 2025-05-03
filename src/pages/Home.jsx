// src/pages/Home.js
import React, { useState } from 'react';
import useProfile from '../hooks/useProfile';
import usePosts from '../hooks/usePosts';
import CreatePostModal from '../components/CreatePostModal';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Post from '../components/Post';
import StoryList from '../components/StoryList';

const Home = () => {
  const { user } = useProfile();
  const { posts, fetchPosts } = usePosts();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8 mt-10">
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
          posts.map(post => <Post key={post.id} post={post} />)
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Chưa có bài viết nào
          </p>
        )}

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