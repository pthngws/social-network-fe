import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { userService } from '../services/userService';
import { friendshipService } from '../services/friendshipService';
import { notifyService } from '../services/notifyService';
import { messageService } from '../services/messageService';
import { connectWebSocket, disconnectWebSocket } from '../services/websocketService';
import LogoAndSearch from './LogoAndSearch';
import FriendRequestsDropdown from './FriendRequestsDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import UserMenuDropdown from './UserMenuDropdown';
import ChatListDropdown from './ChatListDropdown';
import { FaHome, FaCalendarAlt  } from 'react-icons/fa';

// Memoize child components
const MemoizedLogoAndSearch = memo(LogoAndSearch);
const MemoizedFriendRequestsDropdown = memo(FriendRequestsDropdown);
const MemoizedNotificationsDropdown = memo(NotificationsDropdown);
const MemoizedUserMenuDropdown = memo(UserMenuDropdown);
const MemoizedChatListDropdown = memo(ChatListDropdown);

const Header = ({ selectedFriend, setSelectedFriend, user: propUser, onLogout }) => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showFriendMenu, setShowFriendMenu] = useState(false);
  const [showNotifyMenu, setShowNotifyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // Use prop user if provided
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  // Memoize handlers
  const handleFriendSelect = useCallback((friend) => {
    setSelectedFriend({ ...friend, refreshFriendList });
  }, [setSelectedFriend]);

  const refreshFriendList = useCallback(async () => {
    try {
      const response = await messageService.getFriendList(localStorage.getItem('userId'));
      console.log('Refreshed friend list:', response);
      setFriends(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Lỗi làm mới danh sách bạn bè:', error);
    }
  }, []);

  useEffect(() => {
    // Skip API calls if user is already provided through props
    if (propUser) return;

    const email = localStorage.getItem('email');
    const token = localStorage.getItem('token');
    if (!email || !token) {
      console.error('No email or token found in localStorage');
      return;
    }
    setUserEmail(email);

    const fetchData = async () => {
      try {
        const [profileResponse, requests, notifications, friendsResponse] = await Promise.all([
          userService.getProfile(),
          friendshipService.getFriendshipRequests(),
          notifyService.getNotifications(),
          messageService.getFriendList(localStorage.getItem('userId'))
        ]);

        setUser(profileResponse.data.data || null);
        setFriendRequests(Array.isArray(requests) ? requests : []);
        setNotifications(Array.isArray(notifications) ? notifications : []);
        setFriends(Array.isArray(friendsResponse.data) ? friendsResponse.data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [propUser]);

  useEffect(() => {
    if (userEmail) {
      console.log('Connecting WebSocket for:', userEmail);
      connectWebSocket(userEmail, (notification) => {
        console.log('Received WebSocket notification:', notification);
        if (notification.content.includes('đã gửi lời mời kết bạn')) {
          friendshipService.getFriendshipRequests()
            .then((requests) => {
              console.log('Updated friend requests:', requests);
              setFriendRequests(Array.isArray(requests) ? requests : []);
            })
            .catch((error) => console.error('Lỗi cập nhật lời mời kết bạn:', error));
        } else if (notification.content.includes('đã hủy lời mời kết bạn')) {
          friendshipService.getFriendshipRequests()
            .then((requests) => {
              console.log('Updated friend requests after cancellation:', requests);
              setFriendRequests(Array.isArray(requests) ? requests : []);
            })
            .catch((error) => console.error('Lỗi cập nhật lời mời kết bạn:', error));
        } else {
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
        <MemoizedLogoAndSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex items-center space-x-8">
          <Link
            to="/home"
            className={`relative flex items-center justify-center w-10 h-10 rounded-full group ${
              location.pathname === '/home' ? 'text-blue-500' : ''
            }`}
          >
            <span className="absolute w-16 h-16 rounded-full bg-gray-500 dark:bg-gray-400 opacity-0 group-hover:opacity-20 transition-all duration-300"></span>
            <FaHome
              className="relative h-6 w-6 text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200"
              title="Trang chủ"
            />
          </Link>

           <Link
            to="/tasks"
            className={`relative flex items-center justify-center w-10 h-10 rounded-full group ${
              location.pathname === '/tasks' ? 'text-blue-500' : ''
            }`}
          >
            <span className="absolute w-16 h-16 rounded-full bg-gray-500 dark:bg-gray-400 opacity-0 group-hover:opacity-20 transition-all duration-300"></span>
            <FaCalendarAlt 
              className="relative h-6 w-6 text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200"
              title="Lịch"
            />
          </Link>
          <MemoizedFriendRequestsDropdown
            friendRequests={friendRequests}
            setFriendRequests={setFriendRequests}
            showFriendMenu={showFriendMenu}
            setShowFriendMenu={setShowFriendMenu}
          />
          <MemoizedChatListDropdown
            showChatMenu={showChatMenu}
            setShowChatMenu={setShowChatMenu}
            onFriendSelect={handleFriendSelect}
            friends={friends}
            refreshFriendList={refreshFriendList}
          />
          <MemoizedNotificationsDropdown
            notifications={notifications}
            setNotifications={setNotifications}
            showNotifyMenu={showNotifyMenu}
            setShowNotifyMenu={setShowNotifyMenu}
          />
          <MemoizedUserMenuDropdown
            user={user}
            showUserMenu={showUserMenu}
            setShowUserMenu={setShowUserMenu}
            onLogout={onLogout}
          />
        </div>
      </div>
    </nav>
  );
};

export default memo(Header);