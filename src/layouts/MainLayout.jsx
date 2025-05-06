import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useAuthContext } from "../contexts/AuthContext";

const MainLayout = ({ selectedFriend, setSelectedFriend }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthContext();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    // Show loading or disable UI if needed
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      // Handle error if needed
    }
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
    </div>
  );
};

export default MainLayout;