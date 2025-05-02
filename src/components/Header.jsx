import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { friendshipService } from '../services/friendshipService';
import { notifyService } from '../services/notifyService';
import { connectWebSocket, disconnectWebSocket } from '../services/websocketService';
import LogoAndSearch from './LogoAndSearch';
import FriendRequestsDropdown from './FriendRequestsDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import UserMenuDropdown from './UserMenuDropdown';
import ChatListDropdown from './ChatListDropdown';
import { FaHome } from 'react-icons/fa';

const Header = ({ selectedFriend, setSelectedFriend }) => {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showFriendMenu, setShowFriendMenu] = useState(false);
  const [showNotifyMenu, setShowNotifyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('email');
    const token = localStorage.getItem('token');
    if (!email || !token) {
      console.error('No email or token found in localStorage');
      return;
    }
    setUserEmail(email);

    userService.getProfile()
      .then((response) => {
        console.log('User profile:', response.data);
        setUser(response.data.data || null);
      })
      .catch((error) => console.error('Lỗi lấy thông tin người dùng:', error));

    const fetchFriendRequests = async () => {
      try {
        const requests = await friendshipService.getFriendshipRequests();
        console.log('Initial friend requests:', requests);
        setFriendRequests(Array.isArray(requests) ? requests : []);
      } catch (error) {
        console.error('Lỗi lấy lời mời kết bạn:', error);
        setFriendRequests([]);
      }
    };
    fetchFriendRequests();

    const fetchNotifications = async () => {
      try {
        const notifications = await notifyService.getNotifications();
        console.log('Initial notifications:', notifications);
        setNotifications(Array.isArray(notifications) ? notifications : []);
      } catch (error) {
        console.error('Lỗi lấy thông báo:', error);
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (userEmail) {
      console.log('Connecting WebSocket for:', userEmail);
      connectWebSocket(userEmail, (notification) => {
        console.log('Received WebSocket notification:', notification);

        if (notification.content.includes('đã gửi lời mời kết bạn')) {
          console.log('Friend request notification detected, fetching requests...');
          friendshipService.getFriendshipRequests()
            .then((requests) => {
              console.log('Updated friend requests:', requests);
              setFriendRequests(Array.isArray(requests) ? requests : []);
            })
            .catch((error) => console.error('Lỗi cập nhật lời mời kết bạn:', error));
        } else if (notification.content.includes('đã hủy lời mời kết bạn')) {
          console.log('Friend request cancellation detected, fetching requests...');
          friendshipService.getFriendshipRequests()
            .then((requests) => {
              console.log('Updated friend requests after cancellation:', requests);
              setFriendRequests(Array.isArray(requests) ? requests : []);
            })
            .catch((error) => console.error('Lỗi cập nhật lời mời kết bạn:', error));
        } else {
          console.log('General notification detected, fetching notifications...');
          notifyService.getNotifications()
            .then((notifications) => {
              console.log('Updated notifications:', notifications);
              setNotifications(Array.isArray(notifications) ? notifications : []);
            })
            .catch((error) => console.error('Lỗi cập nhật thông báo:', error));
        }
      });
      setIsWebSocketConnected(true);
    }

    return () => {
      if (isWebSocketConnected) {
        console.log('Disconnecting WebSocket');
        disconnectWebSocket();
        setIsWebSocketConnected(false);
      }
    };
  }, [userEmail]);

  return (
    <nav className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 fixed w-full top-0 z-50 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <LogoAndSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex items-center space-x-8">
          <a
            href="/home"
            className="relative flex items-center justify-center w-10 h-10 rounded-full group"
          >
            <span className="absolute w-16 h-16 rounded-full bg-gray-500 dark:bg-gray-400 opacity-0 group-hover:opacity-20 transition-all duration-300"></span>
            <FaHome
              className="relative h-6 w-6 text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200"
              title="Trang chủ"
            />
          </a>
          <ChatListDropdown
            showChatMenu={showChatMenu}
            setShowChatMenu={setShowChatMenu}
            onFriendSelect={setSelectedFriend}
          />
          <FriendRequestsDropdown
            friendRequests={friendRequests}
            setFriendRequests={setFriendRequests}
            showFriendMenu={showFriendMenu}
            setShowFriendMenu={setShowFriendMenu}
          />
          <NotificationsDropdown
            notifications={notifications}
            setNotifications={setNotifications}
            showNotifyMenu={showNotifyMenu}
            setShowNotifyMenu={setShowNotifyMenu}
          />
          <UserMenuDropdown
            user={user}
            showUserMenu={showUserMenu}
            setShowUserMenu={setShowUserMenu}
          />
        </div>
      </div>
    </nav>
  );
};

export default Header;