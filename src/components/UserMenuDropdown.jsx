import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, ArrowLeftEndOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

const UserMenuDropdown = ({ user, showUserMenu, setShowUserMenu }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowUserMenu]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button toggle dropdown */}
      <button
        className="flex items-center space-x-2 focus:outline-none"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        <img
          src={user?.avatar || '/default-avatar.png'}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
        />
        <div className="bg-gray-700 rounded-full p-1 absolute bottom-0 right-0 mb-0.5 mr-0.5 shadow-md">
          <ChevronDownIcon className="h-2.5 w-2.5 text-white" />
        </div>
      </button>

      {/* Dropdown menu */}
      {showUserMenu && (
        <div className="absolute right-0 mt-3 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
          <div className="px-4 py-3 flex items-center border-b border-gray-200 dark:border-gray-700">
            <img
              src={user?.avatar || '/default-avatar.png'}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover mr-2"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <a
            href="/profile"
            className="flex items-center px-4 py-3 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
          >
            <UserCircleIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-300" />
            Trang cá nhân
          </a>
          <button
            className="flex items-center w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            onClick={handleLogout}
          >
            <ArrowLeftEndOnRectangleIcon className="h-5 w-5 mr-2 text-red-500" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenuDropdown;