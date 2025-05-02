import React, { useState, useEffect } from 'react';
import { messageService } from '../services/messageService';

const ChatListDropdown = ({ showChatMenu, setShowChatMenu, onFriendSelect }) => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const userId = localStorage.getItem('userId');

  const fetchFriends = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await messageService.getFriendList(userId);
      console.log('Friend list response:', response);
      const friends = response.data || [];
      setFriends(friends);
    } catch (error) {
      console.error('Lỗi lấy danh sách bạn:', error);
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFriends();
      const interval = setInterval(fetchFriends, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const formatMinutesAgo = (minutesAgo) => {
    if (!minutesAgo) return '';
    if (minutesAgo < 60) {
      return `${minutesAgo} phút trước`;
    }
    const hours = Math.floor(minutesAgo / 60);
    if (hours < 24) {
      return `${hours} giờ trước`;
    }
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };
  
  const getStatusText = (isOnline, minutesAgo) => {
    if (isOnline) {
      return 'Đang hoạt động';
    }
    if (!minutesAgo) {
      return '';
    }
    return `Hoạt động ${formatMinutesAgo(minutesAgo)}`;
  };

  const handleFriendClick = (friend) => {
    console.log('Selected friend:', friend);
    if (!friend || !friend.userID) {
      console.error('Invalid friend data:', friend);
      return;
    }
    
    if (onFriendSelect) {
      console.log('Calling onFriendSelect with:', friend);
      onFriendSelect({
        userID: friend.userID,
        name: friend.name,
        avatar: friend.avatar || 'https://via.placeholder.com/32',
        isOnline: friend.isOnline || false,
        minutesAgo: friend.minutesAgo || null
      });
    } else {
      console.error('onFriendSelect is not defined');
    }
    setShowChatMenu(false);
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center w-10 h-10 rounded-full group"
        onClick={() => {
          setShowChatMenu(!showChatMenu);
          if (!showChatMenu) {
            fetchFriends();
          }
        }}
      >
        <span className="absolute w-16 h-16 rounded-full bg-gray-500 dark:bg-gray-400 opacity-0 group-hover:opacity-20 transition-all duration-300"></span>
        <svg
          className="relative h-6 w-6 text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {showChatMenu && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tin nhắn</h3>
          </div>
          <div className="max-h-96 overflow-y-auto custom-scroll">
            {isLoading ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Đang tải...</p>
            ) : friends.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Chưa có bạn</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {[...friends].filter(friend => friend && friend.userID).sort((a, b) => {
                  if (a.isOnline && !b.isOnline) return -1;
                  if (!a.isOnline && b.isOnline) return 1;
                  return (a.minutesAgo || Infinity) - (b.minutesAgo || Infinity);
                }).map((friend) => (
                  <li
                    key={friend.userID}
                    className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleFriendClick(friend)}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        <img
                          src={friend.avatar || 'https://via.placeholder.com/32'}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/32';
                          }}
                        />
                        {friend.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {friend.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getStatusText(friend.isOnline, friend.minutesAgo)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatListDropdown;