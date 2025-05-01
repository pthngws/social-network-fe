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
      <button
        className="flex items-center space-x-2"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        <img
          src={user?.avatar || '/default-avatar.png'}
          alt="Avatar"
          className="w-10 h-10 rounded-full"
        />
        <div className="bg-gray-700 rounded-full p-1 absolute bottom-0 right-0 mb-0.5 mr-0.5">
          <ChevronDownIcon className="h-2 w-2 text-white" />
        </div>
      </button>
      {showUserMenu && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 z-50">
  <a href="/profile" className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
    <UserCircleIcon className="h-5 w-5 mr-2" />
    Trang cá nhân
  </a>
  <hr className="border-gray-200 dark:border-gray-700" />
  <button
    className="flex items-center w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
    onClick={handleLogout}
  >
    <ArrowLeftEndOnRectangleIcon className="h-5 w-5 mr-2" />
    Đăng xuất
  </button>
</div>

      )}
    </div>
  );
};

export default UserMenuDropdown;
