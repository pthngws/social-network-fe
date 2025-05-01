import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from "react-icons/fa";

const LogoAndSearch = ({ searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const [searchHistory, setSearchHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Lấy lịch sử tìm kiếm từ localStorage khi component được load
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    setSearchHistory(history);
    setFilteredHistory(history.slice(0, 10)); // Hiển thị 10 mục tìm kiếm gần nhất khi chưa gõ gì
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Lưu vào lịch sử tìm kiếm (cập nhật nếu đã có trong lịch sử)
      const updatedHistory = [searchQuery, ...searchHistory.filter(item => item !== searchQuery)].slice(0, 10); // Giới hạn 10 tìm kiếm gần nhất
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      
      // Chuyển hướng tới trang tìm kiếm
      navigate(`/search/${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchHistory(updatedHistory);
      setFilteredHistory(updatedHistory); // Cập nhật lại lịch sử hiển thị
    }
  };

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      // Nếu người dùng gõ, lọc lịch sử tìm kiếm theo từ khóa
      const filtered = searchHistory.filter(item => item.toLowerCase().includes(query.toLowerCase()));
      setFilteredHistory(filtered);
    } else {
      // Nếu không gõ gì, hiển thị 10 mục tìm kiếm gần nhất
      setFilteredHistory(searchHistory.slice(0, 10));
    }
  };

  const handleInputClick = () => {
    setIsDropdownVisible(true); // Hiển thị dropdown khi click vào ô tìm kiếm
  };

  const handleBlur = () => {
    // Ẩn dropdown khi người dùng click ra ngoài
    setTimeout(() => setIsDropdownVisible(false), 200);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
    setFilteredHistory([]);
  };

  const removeSearchHistoryItem = (itemToRemove) => {
    const updatedHistory = searchHistory.filter(item => item !== itemToRemove);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    setSearchHistory(updatedHistory);
    setFilteredHistory(updatedHistory); // Cập nhật lại danh sách hiển thị
  };

  return (
    <div className="flex items-center space-x-4">
      {/* <a href="/home">
        <img src="/logo-white.png" alt="Logo" className=" w-10 h-10" />
      </a> */}

      <div className="relative w-full">
        <input
          type="text"
          placeholder="Tìm kiếm"
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full pl-10 pr-4 py-2 focus:outline-none w-80"
          value={searchQuery}
          onChange={handleInputChange}
          onClick={handleInputClick} // Thêm sự kiện click để toggle dropdown
          onBlur={handleBlur} // Ẩn dropdown khi mất focus
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <FaSearch 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" 
          onClick={handleSearch} 
        />
        
        {/* Hiển thị lịch sử tìm kiếm */}
        {isDropdownVisible && (searchQuery || searchHistory.length > 0) && (
          <ul className="absolute w-full bg-white border border-gray-300 mt-2 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
            {(searchQuery.trim() ? filteredHistory : searchHistory.slice(0, 10)).map((historyItem, index) => (
              <li
                key={index}
                className="px-4 py-2 text-gray-900 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                onClick={() => {
                  setSearchQuery(historyItem);
                  navigate(`/search/${encodeURIComponent(historyItem)}`);
                }}
              >
                {historyItem}
                <FaTimes 
                  className="text-gray-500 hover:text-red-500 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation(); // Ngừng sự kiện click lan truyền khi nhấn vào nút xóa
                    removeSearchHistoryItem(historyItem);
                  }} 
                />
              </li>
            ))}
            {/* Nút xóa tất cả lịch sử tìm kiếm */}
            <li 
              className="px-4 py-2 text-red-500 text-center cursor-pointer hover:bg-gray-100"
              onClick={clearSearchHistory}
            >
              Xóa tất cả
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default LogoAndSearch;
