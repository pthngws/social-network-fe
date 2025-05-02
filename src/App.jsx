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
import { startOnlineStatusPing } from "./services/onlineStatusManager";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [selectedFriend, setSelectedFriend] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      console.log("Starting online status ping for userId:", userId);
      const stopPing = startOnlineStatusPing(userId);
      return stopPing;
    }
  }, [userId]);

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

  return (
    <LoadingProvider>
      <FilterProvider>
        <Router>
          <div className={isDarkMode ? "dark" : ""}>
            <Loading />
            <button
              onClick={toggleDarkMode}
              className={`fixed bottom-5 left-4 w-12 h-6 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                isDarkMode ? "bg-gray-700" : "bg-gray-300"
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
              <Route element={<MainLayout selectedFriend={selectedFriend} setSelectedFriend={setSelectedFriend} />}>
                <Route
                  path="/home"
                  element={
                    <PrivateRoute>
                      <Home />
                      <FriendListSidebar onFriendSelect={setSelectedFriend} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/search/:name"
                  element={
                    <PrivateRoute>
                      <Search />
                      <FriendListSidebar onFriendSelect={setSelectedFriend} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                      <FriendListSidebar onFriendSelect={setSelectedFriend} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/:userId"
                  element={
                    <PrivateRoute>
                      <UserProfile />
                      <FriendListSidebar onFriendSelect={setSelectedFriend} />
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