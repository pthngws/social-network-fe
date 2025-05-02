import React, { useEffect, useRef, useState } from 'react';
import { FaUserGroup } from "react-icons/fa6";
import { friendshipService } from '../services/friendshipService';
import Alert from './ui/Alert';      

const FriendRequestsDropdown = ({ friendRequests, setFriendRequests, showFriendMenu, setShowFriendMenu }) => {
  const dropdownRef = useRef();
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch friend requests when dropdown opens
  useEffect(() => {
    if (showFriendMenu) {
      setIsLoading(true);
      friendshipService.getFriendshipRequests()
        .then((requests) => {
          console.log('Fetched friend requests on open:', requests); // Debug
          setFriendRequests(Array.isArray(requests) ? requests : []);
        })
        .catch((error) => {
          console.error('Error fetching friend requests on open:', error);
          setFriendRequests([]);
          addAlert('Lỗi khi tải lời mời kết bạn', 'error');
        })
        .finally(() => setIsLoading(false));
    }
  }, [showFriendMenu, setFriendRequests]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFriendMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowFriendMenu]);

  // Calculate time ago
  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  // Accept friend request
  const handleAcceptFriend = async (userId) => {
    try {
      await friendshipService.acceptFriendship({ receiverId: userId });
      setFriendRequests((prev) => prev.filter((req) => req.user.id !== userId));
      addAlert('Đã chấp nhận lời mời kết bạn', 'success');
    } catch (error) {
      console.error('Error accepting friend:', error);
      if (error.response?.status === 404) {
        setFriendRequests((prev) => prev.filter((req) => req.user.id !== userId));
        addAlert('Lời mời kết bạn đã bị hủy bởi người gửi', 'error');
      } else {
        addAlert('Lỗi khi chấp nhận lời mời', 'error');
      }
    }
  };

  // Reject friend request
  const handleRejectFriend = async (userId) => {
    try {
      await friendshipService.cancelFriendship({ receiverId: userId });
      setFriendRequests((prev) => prev.filter((req) => req.user.id !== userId));
      addAlert('Đã từ chối lời mời kết bạn', 'success');
    } catch (error) {
      console.error('Error rejecting friend:', error);
      if (error.response?.status === 404) {
        setFriendRequests((prev) => prev.filter((req) => req.user.id !== userId));
        addAlert('Lời mời kết bạn đã bị hủy bởi người gửi', 'error');
      } else {
        addAlert('Lỗi khi từ chối lời mời', 'error');
      }
    }
  };

  // Add new alert
  const addAlert = (message, type) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  };

  // Remove alert
  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative flex items-center justify-center w-10 h-10 rounded-full group"
        onClick={() => setShowFriendMenu(!showFriendMenu)}
      >
        <span className="absolute w-16 h-16 rounded-full bg-gray-500 dark:bg-gray-400 opacity-0 group-hover:opacity-20 transition-all duration-300"></span>
        <FaUserGroup
          className="relative h-6 w-6 text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200"
          title="Lời mời kết bạn"
        />
        {friendRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {friendRequests.length}
          </span>
        )}
      </button>

      {showFriendMenu && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 custom-scroll transition-all duration-200">
          <h6 className="px-4 py-2 font-bold border-b border-gray-200 dark:border-gray-700">
            Lời mời kết bạn
          </h6>
          <div className="max-h-64 overflow-y-auto custom-scroll">
            {isLoading ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Đang tải...</p>
            ) : friendRequests.length > 0 ? (
              friendRequests.map((request) => (
                <div
                  key={request.user.id}
                  className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src={request.user.avatar || 'https://via.placeholder.com/32'}
                        alt={`${request.user.firstName} ${request.user.lastName}`}
                        className="w-10 h-10 rounded-full mr-2"
                      />
                      <div>
                        <a
                          href={`/${request.user.id}`}
                          className="font-bold text-gray-900 dark:text-white hover:underline"
                        >
                          {request.user.firstName} {request.user.lastName}
                        </a>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {timeAgo(request.requestTimestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors duration-150"
                        onClick={() => handleAcceptFriend(request.user.id)}
                      >
                        Chấp nhận
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors duration-150"
                        onClick={() => handleRejectFriend(request.user.id)}
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                Không có lời mời nào.
              </p>
            )}
          </div>
        </div>
      )}

      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          message={alert.message}
          type={alert.type}
          duration={4000}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </div>
  );
};

export default FriendRequestsDropdown;