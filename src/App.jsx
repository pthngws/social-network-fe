import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicRoute from "./routes/PublicRoute";
import PrivateRoute from "./routes/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Search from "./components/Search";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { FilterProvider } from "./contexts/FilterContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import MainLayout from "./layouts/MainLayout";
import ChatPopup from "./components/ChatPopup";
import FriendListSidebar from "./components/FriendListSidebar";
import Loading from "./components/Loading";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend);
  };

  return (
    <LoadingProvider>
      <FilterProvider>
        <Router>
          <div className={isDarkMode ? "dark" : ""}>
            <Loading />
            {/* Nút toggle dark mode */}
            <button
              onClick={toggleDarkMode}
              className={`fixed bottom-5 left-4 w-12 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                isDarkMode ? "bg-gray-700" : "bg-blue-400"
              } z-40`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isDarkMode ? "translate-x-6" : "translate-x-0"
                }`}
              >
                {isDarkMode ? (
                  <MoonIcon className="w-3 h-3 text-gray-700" />
                ) : (
                  <SunIcon className="w-3 h-3 text-blue-500" />
                )}
              </div>
            </button>

            <ChatPopup selectedFriend={selectedFriend} />

            <Routes>
              {/* Public routes */}
              <Route
                path="/"
                element={<PublicRoute><Login /></PublicRoute>}
              />
              <Route
                path="/login"
                element={<PublicRoute><Login /></PublicRoute>}
              />
              <Route
                path="/register"
                element={<PublicRoute><Register /></PublicRoute>}
              />
              {/* Private routes (yêu cầu đăng nhập) */}
              <Route element={<MainLayout />}>
                <Route
                  path="/home"
                  element={
                    <PrivateRoute>
                      <Home />
                      <FriendListSidebar onFriendSelect={handleFriendSelect} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/search/:name"
                  element={
                    <PrivateRoute>
                      <Search />
                      <FriendListSidebar onFriendSelect={handleFriendSelect} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                      <FriendListSidebar onFriendSelect={handleFriendSelect} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/:userId"
                  element={
                    <PrivateRoute>
                      <UserProfile />
                      <FriendListSidebar onFriendSelect={handleFriendSelect} />
                    </PrivateRoute>
                  }
                />
              </Route>
            </Routes>
          </div>
        </Router>
      </FilterProvider>
    </LoadingProvider>
  );
}

export default App;