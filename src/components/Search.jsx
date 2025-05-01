import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../services/userService';
import { friendshipService } from '../services/friendshipService';

const Search = () => {
  const { name } = useParams();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (name) {
      userService.searchUsers(name)
        .then(response => {
          if (response.data.status === 200) {
            setUsers(response.data.data);
          }
        })
        .catch(error => console.error('Lỗi tìm kiếm:', error));
    }
  }, [name]);

  const handleFriendAction = (userId, action) => {
    const actions = {
      send: () => friendshipService.addFriendship({ receiverId: userId }),
      accept: () => friendshipService.acceptFriendship({ receiverId: userId }),
      cancel: () => friendshipService.cancelFriendship({ receiverId: userId }),
    };
    actions[action]()
      .then(() => window.location.reload())
      .catch(error => alert('Lỗi: ' + error));
  };

  const getButtonProps = (friendStatus, userId) => {
    switch (friendStatus) {
      case 'PENDING':
        return { text: 'Hủy yêu cầu', action: () => handleFriendAction(userId, 'cancel') };
      case 'ACCEPTED':
        return { text: 'Bạn bè', action: () => confirm('Hủy bạn bè?') && handleFriendAction(userId, 'cancel') };
      case 'SENT_BY_OTHER':
        return { text: 'Chấp nhận', action: () => handleFriendAction(userId, 'accept') };
      default:
        return { text: 'Kết bạn', action: () => handleFriendAction(userId, 'send') };
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-8 mt-10">
      <div className="max-w-2xl mx-auto">
      {users.length > 0 ? (
        users.map(user => {
          const { text, action } = getButtonProps(user.friendStatus, user.id);
          return (
            <div key={user.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                  <div>
                    <a href={`/${user.id}`} className="font-bold text-black dark:text-white">
                      {user.firstName} {user.lastName}
                    </a>
                    <p className="text-gray-500 dark:text-gray-400">{user.about || 'Không có thông tin.'}</p>
                  </div>
                </div>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                  onClick={action}
                >
                  {text}
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center font-bold text-black dark:text-white">Không tìm thấy người dùng.</p>
      )}
    </div>
    </div>
  );
};

export default Search;