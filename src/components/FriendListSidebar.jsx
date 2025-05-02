import React, { useState, useEffect } from 'react';
import { friendshipService } from '../services/friendshipService';
import { onlineStatusService } from '../services/onlineStatusService';

const FriendListSidebar = ({ onFriendSelect }) => {
  const [friends, setFriends] = useState([]);
  const [statusData, setStatusData] = useState({});
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      const fetchFriends = async () => {
        try {
          const friends = await friendshipService.getAllFriendships();
          console.log('Friends list:', friends); // Debug danh sách bạn bè
          setFriends(Array.isArray(friends) ? friends : []);

          // Lấy trạng thái và số phút kể từ last seen cho từng bạn bè
          const statusPromises = friends.map(friend =>
            Promise.all([
              onlineStatusService.isUserOnline(friend.user.id),
              onlineStatusService.getLastSeenMinutesAgo(friend.user.id)
            ])
              .then(([isOnlineResponse, minutesAgoResponse]) => {
                console.log(`Status for user ${friend.user.id}: isOnline = ${isOnlineResponse.data}, minutesAgo = ${minutesAgoResponse.data}`); // Debug
                return {
                  id: friend.user.id,
                  isOnline: isOnlineResponse.data,
                  minutesAgo: minutesAgoResponse.data
                };
              })
              .catch(error => {
                console.error(`Error fetching status for user ${friend.user.id}:`, error);
                return { id: friend.user.id, isOnline: false, minutesAgo: null };
              })
          );
          const statuses = await Promise.all(statusPromises);
          const statusMap = statuses.reduce((acc, { id, isOnline, minutesAgo }) => {
            acc[id] = { isOnline, minutesAgo };
            return acc;
          }, {});
          console.log('Status map:', statusMap); // Debug statusMap
          setStatusData(statusMap);
        } catch (error) {
          console.error('Lỗi lấy danh sách bạn bè:', error);
          setFriends([]);
        }
      };
      fetchFriends();

      // Cập nhật trạng thái mỗi 30 giây
      const interval = setInterval(fetchFriends, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Hàm hiển thị trạng thái
  const getStatusText = (isOnline, minutesAgo) => {
    if (isOnline) {
      return 'Online';
    }
    if (minutesAgo === null) {
      return 'Offline';
    }
    return `Online ${minutesAgo} phút trước`;
  };

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
                <div className="relative">
                  <img
                    src={friend.user.avatar || 'https://via.placeholder.com/32'}
                    alt={`${friend.user.firstName} ${friend.user.lastName}`}
                    className="w-8 h-8 rounded-full object-cover mr-2"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/32';
                    }}
                  />
                  {statusData[friend.user.id]?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">
                    {friend.user.firstName} {friend.user.lastName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getStatusText(
                      statusData[friend.user.id]?.isOnline,
                      statusData[friend.user.id]?.minutesAgo
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FriendListSidebar;