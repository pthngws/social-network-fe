import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/Header";

const MainLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Logic lấy user từ localStorage (giống Profile và ViewResume)
  useEffect(() => {
    const token = localStorage.getItem("token");

  
  }, []);

  // Hàm logout chung
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col transition-all duration-300">
      <Header user={user} onLogout={handleLogout} />
      <main className="mt-5 flex-grow">
        <Outlet /> {/* Nơi render các page con như Profile, ViewResume */}
      </main>
    </div>
  );
};

export default MainLayout;