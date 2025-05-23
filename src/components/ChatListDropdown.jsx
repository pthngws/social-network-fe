import React, { useState, useEffect, useRef } from 'react';
import { FaComments } from 'react-icons/fa';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const ChatListDropdown = ({ showChatMenu, setShowChatMenu, onFriendSelect, friends, refreshFriendList }) => {
  const [isLoading, setIsLoading] = useState(false);
  const userId = localStorage.getItem('userId');
  const stompClientRef = useRef(null);
  const isConnectedRef = useRef(false); // Theo dõi trạng thái kết nối

  useEffect(() => {
    if (!userId) return;

    let retryCount = 0;
    const maxRetries = 3;

    const connectWebSocket = () => {
      console.log(`Attempting WebSocket connection (Attempt ${retryCount + 1}/${maxRetries})`);
      const socket = new SockJS('/ws');
      const client = Stomp.over(socket);
      stompClientRef.current = client;

      client.connect(
        {}, // Có thể thêm header xác thực nếu backend yêu cầu
        () => {
          console.log('WebSocket connected in ChatListDropdown');
          isConnectedRef.current = true;
          client.subscribe('/topic/public', (message) => {
            console.log('Received WebSocket message:', message.body);
            try {
              const receivedMessage = JSON.parse(message.body);
              if (
                String(receivedMessage.senderId) === userId ||
                String(receivedMessage.receiverId) === userId
              ) {
                console.log('Message relevant to user, refreshing friend list');
                refreshFriendList();
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          });
        },
        (error) => {
          console.error('WebSocket error in ChatListDropdown:', error);
          isConnectedRef.current = false;
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying WebSocket connection in 3 seconds...`);
            setTimeout(connectWebSocket, 3000);
          } else {
            console.error('Max WebSocket retries reached. Could not connect.');
          }
        }
      );
    };

    connectWebSocket();

    return () => {
      if (stompClientRef.current && isConnectedRef.current) {
        console.log('Disconnecting WebSocket in ChatListDropdown');
        try {
          stompClientRef.current.disconnect(() => {
            console.log('WebSocket disconnected successfully');
          });
        } catch (error) {
          console.error('Error disconnecting WebSocket:', error);
        }
      }
      isConnectedRef.current = false;
      stompClientRef.current = null;
    };
  }, [userId, refreshFriendList]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleFriendClick = (friend) => {
    if (!friend || !friend.userID) {
      console.error('Invalid friend data:', friend);
      return;
    }
    if (onFriendSelect) {
      onFriendSelect({
        userID: friend.userID,
        name: friend.name,
        avatar: friend.avatar || 'https://via.placeholder.com/32',
        isOnline: friend.isOnline || false,
        minutesAgo: friend.minutesAgo || null,
        refreshFriendList,
      });
    }
    setShowChatMenu(false);
  };

  const totalUnreadCount = friends.reduce((sum, friend) => sum + (friend.unreadCount || 0), 0);

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center w-10 h-10 rounded-full group"
        onClick={() => {
          setShowChatMenu(!showChatMenu);
        }}
      >
        <span className="absolute w-16 h-16 rounded-full bg-gray-500 dark:bg-gray-400 opacity-0 group-hover:opacity-20 transition-all duration-300"></span>
        <FaComments
          className="relative h-6 w-6 text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200"
          title="Tin nhắn"
        />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalUnreadCount}
          </span>
        )}
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
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">Chưa có tin nhắn</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {[...friends]
                  .filter((friend) => friend && friend.userID)
                  .sort((a, b) => {
                    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                    return timeB - timeA;
                  })
                  .map((friend) => (
                    <li
                      key={friend.userID}
                      className={`px-4 py-3 cursor-pointer transition-colors duration-200 ${
                        friend.unreadCount > 0
                          ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleFriendClick(friend)}
                    >
                      <div className="flex items-start">
                        <div className="relative mr-3">
                          <img
                            src={friend.avatar || 'https://via.placeholder.com/32'}
                            alt={friend.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/32';
                            }}
                          />
                          {friend.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white truncate">
                              {friend.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(friend.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                              {(friend.isSender ? 'Bạn: ' : '') + (friend.content || 'Chưa có tin nhắn')}
                            </p>
                            {friend.unreadCount > 0 && (
                              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                                {friend.unreadCount}
                              </span>
                            )}
                          </div>
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