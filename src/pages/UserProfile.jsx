import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { friendshipService } from '../services/friendshipService';
import { messageService } from '../services/messageService';
import Post from '../components/Post';
import Alert from '../components/ui/Alert';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { FaComments } from 'react-icons/fa';

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  // ChatPopup states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [stompClient, setStompClient] = useState(null);
  const chatBoxRef = useRef(null);
  const senderId = String(localStorage.getItem('userId'));
  useEffect(() => {
    if (userId === senderId) {
      window.location.replace('/profile');
    }

    // Fetch user data
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

    // Fetch user posts
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

  useEffect(() => {
    if (isChatOpen && selectedFriend) {
      connectWebSocket();
      loadMessages();
    }
    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, [isChatOpen, selectedFriend]);

  const connectWebSocket = () => {
    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);
    client.connect({}, () => {
      client.subscribe('/topic/public', () => loadMessages());
      setStompClient(client);
    }, (error) => console.error('WebSocket error:', error));
  };

  const loadMessages = () => {
    if (selectedFriend) {
      messageService.getMessages(senderId, selectedFriend.userID)
        .then((response) => {
          setMessages(response.data);
          if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
          }
        })
        .catch((error) => console.error('Lỗi lấy tin nhắn:', error));
    }
  };

  const sendMessage = () => {
    if (messageInput.trim() && stompClient && selectedFriend) {
      const message = {
        content: messageInput,
        senderId: senderId,
        receiverId: selectedFriend.userID,
        timestamp: new Date().toISOString(),
      };
      stompClient.send('/app/sendMessage', {}, JSON.stringify(message));
      setMessageInput('');
      loadMessages();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

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

  const handleInbox = () => {
    if (user) {
      setSelectedFriend({
        userID: userId,
        name: `${user.firstName} ${user.lastName}`,
      });
      setIsChatOpen(true);
    }
  };

  const getButtonProps = (friendStatus) => {
    switch (friendStatus) {
      case 'PENDING':
        return { text: 'Hủy yêu cầu', action: () => handleFriendAction('cancel') };
      case 'ACCEPTED':
        return { text: 'Bạn bè', action: () => handleFriendAction('cancel') };
      case 'SENT_BY_OTHER':
        return { text: 'Chấp nhận', action: () => handleFriendAction('accept') };
      default:
        return { text: 'Kết bạn', action: () => handleFriendAction('send') };
    }
  };

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

        {/* Profile Header */}
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
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                onClick={handleInbox}
              >
                Nhắn tin
              </button>
              {user && (
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
                  onClick={getButtonProps(user.friendStatus).action}
                >
                  {getButtonProps(user.friendStatus).text}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Tab Content */}
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
            <h4 className="font-bold mb-6 text-gray-900 dark:text-white">Thông tin cá nhân</h4>
            <div className="mb-4">
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Ngày sinh</label>
              <input
                type="date"
                className="w-full p-3 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={user?.birthday?.split('T')[0] || ''}
                readOnly
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-2">Giới tính</label>
              <div className="flex space-x-6">
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={user?.gender === 'Male'}
                    disabled
                    className="mr-2"
                  />
                  Nam
                </label>
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={user?.gender === 'Female'}
                    disabled
                    className="mr-2"
                  />
                  Nữ
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Chat Popup */}
        {isChatOpen && selectedFriend && (
          <div className="fixed bottom-16 right-4 w-80 bg-white rounded-lg shadow-lg">
            <div className="flex justify-between items-center bg-blue-500 text-white p-3 rounded-t-lg">
              <span>{selectedFriend.name}</span>
              <button onClick={() => setIsChatOpen(false)}>×</button>
            </div>
            <div ref={chatBoxRef} className="p-4 max-h-64 overflow-y-auto">
              {messages.map((msg, index) => {
                const showDate =
                  index === 0 || formatDateSeparator(messages[index - 1].timestamp) !== formatDateSeparator(msg.timestamp);
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center text-gray-500 my-2">
                        <small>{formatDateSeparator(msg.timestamp)}</small>
                      </div>
                    )}
                    <div className={`flex ${msg.senderID === senderId ? 'justify-end' : 'justify-start'} mb-2`}>
                      <div
                        className={`p-2 rounded-lg ${
                          msg.senderID === senderId ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                        }`}
                      >
                        <span>{msg.contentMessage}</span>
                        <div className="text-xs">{formatTime(msg.timestamp)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Soạn tin nhắn"
                  className="flex-1 p-2 rounded-l-full border"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button className="bg-blue-500 text-white p-2 rounded-r-full" onClick={sendMessage}>
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;