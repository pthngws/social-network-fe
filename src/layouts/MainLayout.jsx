import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ChatPopup from "../components/ChatPopup";

const MainLayout = ({ selectedFriend, setSelectedFriend }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      navigate("/login");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Lỗi phân tích user từ localStorage:", error);
        setUser(null);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col transition-all duration-300">
      <Header
        user={user}
        onLogout={handleLogout}
        selectedFriend={selectedFriend}
        setSelectedFriend={setSelectedFriend}
      />
      <main className="mt-5 flex-grow">
        <Outlet />
      </main>
      <ChatPopup selectedFriend={selectedFriend} />
    </div>
  );
};

export default MainLayout;