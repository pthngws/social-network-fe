import React, { useRef, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';

const NotificationsDropdown = ({ notifications, showNotifyMenu, setShowNotifyMenu }) => {
  const dropdownRef = useRef();

  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifyMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowNotifyMenu]);

  return (
    <div className="relative" ref={dropdownRef}>
<button
  className="relative flex items-center justify-center w-10 h-10 rounded-full group"
  onClick={() => setShowNotifyMenu(!showNotifyMenu)}
>
  {/* Vòng tròn lớn hover */}
  <span className="absolute w-16 h-16 rounded-full bg-gray-500 dark:bg-gray-400 opacity-0 group-hover:opacity-20 transition-all duration-300"></span>

  {/* Icon Bell */}
  <FaBell
    className="relative h-6 w-6 text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200"
    title="Thông báo"
  />

  {/* Badge số lượng */}
  {notifications.filter(n => !n.isRead).length > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {notifications.filter(n => !n.isRead).length}
    </span>
  )}
</button>


      {showNotifyMenu && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 custom-scroll transition-all duration-200">
          <h6 className="px-4 py-2 font-bold border-b border-gray-200 dark:border-gray-700">Thông báo</h6>
          <div className="max-h-64 overflow-y-auto custom-scroll">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div key={notification.id} className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
                  <p className="font-bold">{notification.content}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{timeAgo(notification.date)}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Không có thông báo nào.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
