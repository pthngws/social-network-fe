import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { friendshipService } from '../services/friendshipService';
import { notifyService } from '../services/notifyService';
import LogoAndSearch from './LogoAndSearch';
import FriendRequestsDropdown from './FriendRequestsDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import UserMenuDropdown from './UserMenuDropdown';
import { FaHome } from 'react-icons/fa';
const Header = () => {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showFriendMenu, setShowFriendMenu] = useState(false);
  const [showNotifyMenu, setShowNotifyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Fetch user profile
    userService.getProfile()
      .then(response => {
        if (response.data.status === 200) {
          setUser(response.data.data);
        }
      })
      .catch(error => console.error('Lỗi lấy thông tin người dùng:', error));

    // Fetch friend requests
    friendshipService.getFriendshipRequests()
      .then(response => {
        if (response.data.status === 200) {
          setFriendRequests(response.data.data);
        }
      })
      .catch(error => console.error('Lỗi lấy lời mời kết bạn:', error));

    // Fetch notifications
    notifyService.getNotifications()
      .then(response => {
        if (response.data.status === 200) {
          setNotifications(response.data.data);
        }
      })
      .catch(error => console.error('Lỗi lấy thông báo:', error));
  }, []);

  return (
<nav className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 fixed w-full top-0 z-50 shadow-md">
  <div className="container mx-auto flex items-center justify-between">
    <LogoAndSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

    <div className="flex items-center space-x-8">
      <a href="/home" className="hover:text-primary dark:hover:text-gray-300">
        <FaHome className="h-6 w-6 text-gray-700 dark:text-gray-200" />
      </a>
      <FriendRequestsDropdown
        friendRequests={friendRequests}
        showFriendMenu={showFriendMenu}
        setShowFriendMenu={setShowFriendMenu}
      />
      <NotificationsDropdown
        notifications={notifications}
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