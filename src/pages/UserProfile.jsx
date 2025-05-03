import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { friendshipService } from '../services/friendshipService';
import { onlineStatusService } from '../services/onlineStatusService';
import Post from '../components/Post';
import Alert from '../components/ui/Alert';
import ChatPopup from '../components/ChatPopup';
import FriendListSidebar from '../components/FriendListSidebar';
import { FaUserFriends, FaComments, FaUserPlus, FaUserCheck, FaUserTimes, FaUserClock } from 'react-icons/fa';

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [selectedFriend, setSelectedFriend] = useState(null);
  const senderId = String(localStorage.getItem('userId'));
  const navigate = useNavigate();

  useEffect(() => {
    if (userId === senderId) {
      window.location.replace('/profile');
    }

    userService
      .getUserById(userId)
      .then((response) => {
        if (response.data.status === 200) {
          setUser(response.data.data);
        }
      })
      .catch((error) => {
        setAlert({ show: true, type: 'error', message: 'Lỗi lấy thông tin người dùng' });
      });

    postService
      .getUserPosts(userId)
      .then((response) => {
        if (response.data.status === 200) {
          setPosts(response.data.data);
        }
      })
      .catch((error) => {
        setAlert({ show: true, type: 'error', message: 'Lỗi lấy bài viết' });
      });
  }, [userId, senderId]);

  const handleFriendAction = (action) => {
    const actions = {
      send: () => friendshipService.addFriendship({ receiverId: userId }),
      accept: () => friendshipService.acceptFriendship({ receiverId: userId }),
      cancel: () => friendshipService.cancelFriendship({ receiverId: userId }),
    };

    actions[action]()
      .then(() => {
        userService.getUserById(userId).then((response) => {
          if (response.data.status === 200) {
            setUser(response.data.data);
            setAlert({
              show: true,
              type: 'success',
              message: `Thành công: ${
                action === 'send' ? 'Gửi yêu cầu kết bạn' : action === 'accept' ? 'Chấp nhận kết bạn' : 'Hủy kết bạn'
              }`,
            });
            setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
          }
        });
      })
      .catch((error) => {
        setAlert({ show: true, type: 'error', message: `Lỗi: ${error.message || 'Không thể thực hiện hành động'}` });
      });
  };

  const handleInbox = async () => {
    if (user) {
      try {
        const [isOnlineResponse, minutesAgoResponse] = await Promise.all([
          onlineStatusService.isUserOnline(userId),
          onlineStatusService.getLastSeenMinutesAgo(userId),
        ]);
        setSelectedFriend({
          userID: userId,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar || 'https://via.placeholder.com/32',
          isOnline: isOnlineResponse.data,
          minutesAgo: minutesAgoResponse.data,
        });
      } catch (error) {
        console.error('Lỗi lấy trạng thái online:', error);
        setSelectedFriend({
          userID: userId,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar || 'https://via.placeholder.com/32',
          isOnline: false,
          minutesAgo: null,
        });
      }
    }
  };

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend);
  };

  const getButtonProps = (friendStatus) => {
    switch (friendStatus) {
      case 'PENDING':
        return { 
          text: 'Hủy yêu cầu', 
          action: () => handleFriendAction('cancel'),
          icon: <FaUserTimes />,
          bgColor: 'bg-red-500 hover:bg-red-600'
        };
      case 'ACCEPTED':
        return { 
          text: 'Bạn bè', 
          action: () => handleFriendAction('cancel'),
          icon: <FaUserCheck />,
          bgColor: 'bg-gray-500 hover:bg-gray-600'
        };
      case 'SENT_BY_OTHER':
        return { 
          text: 'Chấp nhận', 
          action: () => handleFriendAction('accept'),
          icon: <FaUserCheck />,
          bgColor: 'bg-blue-500 hover:bg-blue-600'
        };
      default:
        return { 
          text: 'Kết bạn', 
          action: () => handleFriendAction('send'),
          icon: <FaUserPlus />,
          bgColor: 'bg-blue-500 hover:bg-blue-600'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8 mt-10">
      <div className="max-w-2xl mx-auto relative">
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ show: false, type: '', message: '' })}
            className="mb-4"
          />
        )}

        <div className="flex items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <img
            src={user?.avatar || '/default-avatar.png'}
            alt="Avatar"
            className="w-24 h-24 rounded-full mr-4"
          />
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user ? `${user.firstName} ${user.lastName}` : ''}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{user?.about}</p>
            <div className="flex space-x-2 mt-4">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center space-x-2 transition"
                onClick={handleInbox}
              >
                <FaComments />
                <span>Nhắn tin</span>
              </button>

              {user && (
                <button
                  className={`${getButtonProps(user.friendStatus).bgColor} text-white px-4 py-2 rounded flex items-center space-x-2 transition`}
                  onClick={getButtonProps(user.friendStatus).action}
                >
                  {getButtonProps(user.friendStatus).icon}
                  <span>{getButtonProps(user.friendStatus).text}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <ul className="flex border-b mb-4 dark:border-gray-700">
          <li>
            <button
              className={`pb-2 px-4 ${
                activeTab === 'timeline'
                  ? 'border-b-2 border-blue-500 font-bold text-blue-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              Bài viết
            </button>
          </li>
          <li>
            <button
              className={`pb-2 px-4 ${
                activeTab === 'info'
                  ? 'border-b-2 border-blue-500 font-bold text-blue-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('info')}
            >
              Thông tin cá nhân
            </button>
          </li>
        </ul>

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => <Post key={post.id} post={post} />)
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">Chưa có bài viết nào.</p>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="mb-4">
              <label className="block font-bold text-gray-900 dark:text-gray-300 mb-2">Ngày sinh</label>
              <p className="text-gray-900 dark:text-white">
                {user?.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : 'Không xác định'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block font-bold text-gray-900 dark:text-gray-300 mb-2">Giới tính</label>
              <p className="text-gray-900 dark:text-white">
                {user?.gender === 'Male' ? 'Nam' : user?.gender === 'Female' ? 'Nữ' : 'Không xác định'}
              </p>
            </div>
          </div>
        )}

        <FriendListSidebar onFriendSelect={handleFriendSelect} />
        <ChatPopup selectedFriend={selectedFriend} />
      </div>
    </div>
  );
};

export default UserProfile;