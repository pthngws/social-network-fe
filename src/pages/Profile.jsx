import React, { useState, useEffect } from 'react';
import useProfile from '../hooks/useProfile';
import usePosts from '../hooks/usePosts';
import useFriendship from '../hooks/useFriendship';
import CreatePostModal from '../components/CreatePostModal';
import Post from '../components/Post';
import { userService } from '../services/userService';
import { PencilIcon } from '@heroicons/react/24/solid';
import Alert from '../components/ui/Alert';
import { useApiLoading } from '../hooks/useApiLoading';
import Input from '../components/ui/Input';
const Profile = () => {
  const { user, loading: profileLoading, error: profileError, refetch } = useProfile();
  const { posts, fetchPosts } = usePosts('my');
  const { friends, fetchFriends, removeFriend, loading: friendsLoading, error: friendsError } = useFriendship();
  const { startLoading, stopLoading } = useApiLoading();

  const [activeTab, setActiveTab] = useState('timeline');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    about: '',
    birthday: '',
    gender: '',
    avatarFile: null,
  });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' }); // New alert state

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        about: user.about || '',
        birthday: user.birthday?.split('T')[0] || '',
        gender: user.gender || '',
        avatarFile: null,
      });
    }
    if (profileError) {
      setAlert({ show: true, type: 'error', message: `Lỗi tải hồ sơ: ${profileError}` });
    }
    if (friendsError) {
      setAlert({ show: true, type: 'error', message: `Lỗi tải danh sách bạn bè: ${friendsError}` });
    }
  }, [user, profileError, friendsError]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'friends') fetchFriends();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      startLoading();
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        about: formData.about,
        birthday: formData.birthday,
        gender: formData.gender,
      };
      await userService.updateProfile(updateData, formData.avatarFile);
      setAlert({ show: true, type: 'success', message: 'Cập nhật hồ sơ thành công!' });
      refetch();
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: `Lỗi cập nhật: ${err.message || 'Không xác định'}` });
    } finally {
      stopLoading();
    }
  };

  const handleRemoveFriend = async (friendId) => {
    setAlert({ show: true, type: 'warning', message: 'Bạn có chắc chắn muốn xóa bạn bè này?' });
    try {
      startLoading();
      await removeFriend(friendId);
      setAlert({ show: true, type: 'success', message: 'Xóa bạn bè thành công!' });
      fetchFriends();
      setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    } catch (err) {
      setAlert({ show: true, type: 'error', message: 'Lỗi xóa bạn bè' });
    } finally {
      stopLoading();
    }
  };

  if (profileLoading) return <p className="text-center mt-20">Đang tải...</p>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8 mt-10">
      <div className="max-w-2xl mx-auto">
        {/* Alert Display */}
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ show: false, type: '', message: '' })}
            className="mb-4"
          />
        )}

        {/* Header */}
        <div className="flex items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow mb-6">
          <img
            src={user?.avatar || '/default-avatar.png'}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover mr-6 ring-2 ring-blue-400"
          />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {user?.about || 'Chưa cập nhật tiểu sử.'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700 mb-6">
          {['timeline', 'friends', 'info'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 pb-2 transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 font-semibold text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
              }`}
            >
              {tab === 'timeline' && 'Bài viết'}
              {tab === 'friends' && 'Bạn bè'}
              {tab === 'info' && 'Thông tin cá nhân'}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {activeTab === 'timeline' && (
          <div>
            <CreatePostModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              onPostCreated={fetchPosts}
            />
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-4">
            <div className="flex items-center gap-4">
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
            </div>
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => <Post key={post.id} post={post} />)
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">Chưa có bài viết nào.</p>
              )}
            </div>
          </div>
        )}

        {/* Friends */}
        {activeTab === 'friends' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h4 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Bạn bè</h4>
            {friendsLoading && (
              <p className="text-gray-500 dark:text-gray-400">Đang tải danh sách bạn bè...</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.length > 0 ? (
                friends.map((friendship) => (
                  <div
                    key={friendship.user.id}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                  >
                    <div className="flex items-center">
                      <img
                        src={friendship.user.avatar || '/default-avatar.png'}
                        alt={friendship.user.firstName}
                        className="w-12 h-12 rounded-full mr-3"
                      />
                      <div>
                        <a
                          href={`/${friendship.user.id}`}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {friendship.user.firstName} {friendship.user.lastName}
                        </a>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {friendship.user.about || 'Không có thông tin'}
                        </p>
                      </div>
                    </div>
                    <button
                      className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
                      onClick={() => handleRemoveFriend(friendship.user.id)}
                    >
                      Xóa
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center">Bạn chưa có bạn bè nào.</p>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        {activeTab === 'info' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h4 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
              Chỉnh sửa thông tin
            </h4>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex items-start gap-8">
                {/* Avatar chiếm 1/3 */}
                <div className="relative flex-shrink-0 w-1/3">
                  <img
                    src={
                      formData.avatarFile
                        ? URL.createObjectURL(formData.avatarFile)
                        : user?.avatar || '/default-avatar.png'
                    }
                    alt="Avatar"
                    className="mt-10 w-100 h-100 rounded-full object-cover"
                  />
                  <label className="absolute bottom-1 right-6 w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full cursor-pointer group-hover:scale-110 transition-transform">
                    <PencilIcon className="h-4 w-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFormData({ ...formData, avatarFile: e.target.files[0] })}
                    />
                  </label>
                </div>

                {/* Thông tin chiếm 2/3 */}
                <div className="w-2/3 space-y-4">
                  <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Họ
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Tên
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Tiểu sử
                    </label>
                    <textarea
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) =>
                        setFormData({ ...formData, birthday: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Giới tính
                    </label>
                    <div className="flex gap-6 mt-2 text-gray-700 dark:text-gray-300">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="gender"
                          value="Male"
                          checked={formData.gender === 'Male'}
                          onChange={() => setFormData({ ...formData, gender: 'Male' })}
                          className="h-4 w-4 border-2 border-gray-600 rounded-full bg-white checked:bg-blue-600 checked:border-blue-600 dark:checked:bg-blue-400 dark:checked:border-blue-400 dark:border-gray-400 dark:bg-gray-700 appearance-none"
                        />
                        Nam
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="gender"
                          value="Female"
                          checked={formData.gender === 'Female'}
                          onChange={() => setFormData({ ...formData, gender: 'Female' })}
                          className="h-4 w-4 border-2 border-gray-600 rounded-full bg-white checked:bg-blue-600 checked:border-blue-600 dark:checked:bg-blue-400 dark:checked:border-blue-400 dark:border-gray-400 dark:bg-gray-700 appearance-none"
                        />
                        Nữ
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Button Save */}
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;