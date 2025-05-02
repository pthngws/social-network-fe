import React, { useRef, useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { connectWebSocket, disconnectWebSocket } from '../services/websocketService';
import { notifyService } from '../services/notifyService';
import Alert from './ui/Alert';

const NotificationsDropdown = ({ showNotifyMenu, setShowNotifyMenu }) => {
  const dropdownRef = useRef();
  const [notifyList, setNotifyList] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false); // Theo dõi trạng thái kết nối

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifications = await notifyService.getNotifications();
        console.log('Notifications from API:', notifications); // Debug dữ liệu API
        setNotifyList(Array.isArray(notifications) ? notifications : []);
      } catch (error) {
        console.error('Error fetching notifications:', error.response || error); // Log chi tiết lỗi
        addAlert('Lỗi khi tải thông báo', 'error');
        setNotifyList([]);
      }
    };
    fetchNotifications();
  }, []);

  // Get user email
  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      console.error('No userEmail found in localStorage');
      addAlert('Vui lòng đăng nhập để nhận thông báo', 'error');
    }
    setUserEmail(email);
  }, []);

  // Connect WebSocket when userEmail is available
  useEffect(() => {
    if (userEmail) {
      connectWebSocket(userEmail, (newNotification) => {
        console.log('Processing new notification:', newNotification);
        addAlert(newNotification.content, 'success');
        setNotifyList((prev) => {
          const notificationWithKey = {
            ...newNotification,
            id: newNotification.id || `${newNotification.content}-${newNotification.date}`,
          };
          return [notificationWithKey, ...prev];
        });
      });
      setIsWebSocketConnected(true); // Đánh dấu đã kết nối
    }

    // Cleanup: Chỉ ngắt kết nối nếu đã kết nối
    return () => {
      if (isWebSocketConnected) {
        disconnectWebSocket();
        setIsWebSocketConnected(false);
      }
    };
  }, [userEmail]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifyMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowNotifyMenu]);

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

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notifyService.markAllAsRead();
      setNotifyList((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      addAlert('Đã đánh dấu tất cả thông báo là đã đọc', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      addAlert('Lỗi khi đánh dấu tất cả đã đọc', 'error');
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
        onClick={() => setShowNotifyMenu(!showNotifyMenu)}
      >
        <span className="absolute w-16 h-16 rounded-full bg-gray-500 dark:bg-gray-400 opacity-0 group-hover:opacity-20 transition-all duration-300"></span>
        <FaBell
          className="relative h-6 w-6 text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200"
          title="Thông báo"
        />
        {notifyList.filter((n) => n.isRead === 0).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifyList.filter((n) => n.isRead === 0).length}
          </span>
        )}
      </button>

      {showNotifyMenu && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 custom-scroll transition-all duration-200">
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h6 className="font-bold">Thông báo</h6>
            {notifyList.filter((n) => n.isRead === 0).length > 0 && (
              <button
                className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={handleMarkAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto custom-scroll">
  {notifyList.length > 0 ? (
    notifyList
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort từ mới nhất
      .map((notification, index) => (
        <div
          key={notification.id || `temp-key-${index}`}
          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer ${
            notification.isRead === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''
          }`}
        >
          <p
            className={`font-bold ${
              notification.isRead === 0
                ? 'text-black dark:text-white'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {notification.content}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {timeAgo(notification.date)}
          </p>
        </div>
      ))
  ) : (
    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
      Không có thông báo nào.
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

export default NotificationsDropdown;