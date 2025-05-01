import React, { useState, useEffect } from 'react';
import { friendshipService } from '../services/friendshipService';

const FriendListSidebar = ({ onFriendSelect }) => {
  const [friends, setFriends] = useState([]);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      const fetchFriends = async () => {
        try {
          const friends = await friendshipService.getAllFriendships();
          console.log('Friends list:', friends); // Debug
          setFriends(Array.isArray(friends) ? friends : []);
        } catch (error) {
          console.error('Lỗi lấy danh sách bạn bè:', error);
          setFriends([]);
        }
      };
      fetchFriends();
    }
  }, [userId]);

  return (
    <div className="fixed top-20 right-0 w-64 h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col z-10">
      {/* Header của sidebar */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bạn bè</h2>
      </div>

      {/* Danh sách bạn bè */}
      <div className="flex-1 overflow-y-auto custom-scroll p-2">
        {friends.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm pt-4">Chưa có bạn bè</p>
        ) : (
          <ul className="space-y-1">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-150"
                onClick={() =>
                  onFriendSelect({
                    userID: friend.user.id,
                    name: `${friend.user.firstName} ${friend.user.lastName}`,
                  })
                }
              >
                <img
                  src={friend.user.avatar || 'https://via.placeholder.com/32'}
                  alt={`${friend.user.firstName} ${friend.user.lastName}`}
                  className="w-8 h-8 rounded-full object-cover mr-2"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/32';
                  }}
                />
                <span className="text-sm font-medium truncate">
                  {friend.user.firstName} {friend.user.lastName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FriendListSidebar;