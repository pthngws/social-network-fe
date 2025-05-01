import React, { useEffect, useRef } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/solid';
import { friendshipService } from '../services/friendshipService';

const FriendRequestsDropdown = ({ friendRequests, showFriendMenu, setShowFriendMenu }) => {
  const dropdownRef = useRef();

  // Xử lý click ra ngoài component để đóng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFriendMenu(false);
      }
    };

    if (showFriendMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup khi component unmount hoặc menu ẩn
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFriendMenu]);

  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  const handleAcceptFriend = (userId) => {
    friendshipService.acceptFriendship({ receiverId: userId })
      .then(() => window.location.reload())
      .catch(error => alert('Lỗi khi chấp nhận lời mời: ' + error));
  };

  const handleRejectFriend = (userId) => {
    friendshipService.cancelFriendship({ receiverId: userId })
      .then(() => window.location.reload())
      .catch(error => alert('Lỗi khi từ chối lời mời: ' + error));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="hover:text-primary dark:hover:text-gray-300"
        onClick={() => setShowFriendMenu(!showFriendMenu)}
      >
        <UserGroupIcon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
        {friendRequests.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {friendRequests.length}
          </span>
        )}
      </button>
      {showFriendMenu && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg z-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
  <h6 className="px-4 py-2 font-bold border-b dark:border-gray-700">Lời mời kết bạn</h6>
  <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            {friendRequests.length > 0 ? (
              friendRequests.map(request => (
                <div key={request.user.id} className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center">
                    <img
                      src={request.user.avatar}
                      alt={request.user.firstName}
                      className="w-10 h-10 rounded-full mr-2"
                    />
                    <div>
                      <a href={`/${request.user.id}`} className="font-bold text-black">
                        {request.user.firstName} {request.user.lastName}
                      </a>
                      <p className="text-sm text-gray-500">{timeAgo(request.requestTimestamp)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                      onClick={() => handleAcceptFriend(request.user.id)}
                    >
                      Chấp nhận
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => handleRejectFriend(request.user.id)}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Không có lời mời nào.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendRequestsDropdown;
