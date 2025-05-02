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
          console.log('Friends list:', friends);
          setFriends(Array.isArray(friends) ? friends : []);

          const statusPromises = friends.map(friend =>
            Promise.all([
              onlineStatusService.isUserOnline(friend.user.id),
              onlineStatusService.getLastSeenMinutesAgo(friend.user.id)
            ])
              .then(([isOnlineResponse, minutesAgoResponse]) => {
                console.log(`Status for user ${friend.user.id}: isOnline = ${isOnlineResponse.data}, minutesAgo = ${minutesAgoResponse.data}`);
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
          console.log('Status map:', statusMap);
          setStatusData(statusMap);
        } catch (error) {
          console.error('Lỗi lấy danh sách bạn:', error);
          setFriends([]);
        }
      };
      fetchFriends();

      const interval = setInterval(fetchFriends, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const formatMinutesAgo = (minutesAgo) => {
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
    if (minutesAgo === null) {
      return '';
    }
    return `Hoạt động ${formatMinutesAgo(minutesAgo)}`;
  };

  return (
    <div className="fixed top-20 right-0 w-64 h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col z-10">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-me font-semibold text-gray-700 dark:text-gray-300">Danh sách bạn</h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scroll p-2">
        {friends.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm pt-4">Chưa có bạn</p>
        ) : (
          <ul className="space-y-1">
            {[...friends].sort((a, b) => {
  const statusA = statusData[a.user.id];
  const statusB = statusData[b.user.id];

  // Nếu A online và B offline => A lên trên
  if (statusA?.isOnline && !statusB?.isOnline) return -1;
  if (!statusA?.isOnline && statusB?.isOnline) return 1;

  // Cả 2 cùng online hoặc cùng offline
  // Sắp xếp theo minutesAgo tăng dần (người mới hoạt động hơn lên trên)
  return (statusA?.minutesAgo || Infinity) - (statusB?.minutesAgo || Infinity);
}).map((friend) => (
              <li
                key={friend.id}
                className="flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-150"
                onClick={() =>
                  onFriendSelect({
                    userID: friend.user.id,
                    name: `${friend.user.firstName} ${friend.user.lastName}`,
                    avatar: friend.user.avatar || 'https://via.placeholder.com/32',
                    isOnline: statusData[friend.user.id]?.isOnline || false,
                    minutesAgo: statusData[friend.user.id]?.minutesAgo || null
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

                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">
                    {friend.user.firstName} {friend.user.lastName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
  {statusData[friend.user.id]?.isOnline && (
    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
  )}
  <span>
    {getStatusText(
      statusData[friend.user.id]?.isOnline,
      statusData[friend.user.id]?.minutesAgo
    )}
  </span>
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